#!/bin/bash

# Zero Downtime Deployment Script for Item Service
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVICE_NAME="item-service"
NAMESPACE="pose-microservices"
IMAGE_NAME="backend-item-service"
VERSION="${1:-latest}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Zero Downtime Deployment${NC}"
echo -e "${BLUE}  Service: ${SERVICE_NAME}${NC}"
echo -e "${BLUE}  Version: ${VERSION}${NC}"
echo -e "${BLUE}========================================${NC}"

# 1. Check current status
echo -e "\n${YELLOW}1. Current Deployment Status:${NC}"
kubectl -n $NAMESPACE get deployment $SERVICE_NAME 2>/dev/null || echo "Deployment not found"
kubectl -n $NAMESPACE get pods -l app=$SERVICE_NAME 2>/dev/null || echo "No pods found"

# 2. Build Docker image
echo -e "\n${YELLOW}2. Building Docker Image...${NC}"
cd /var/www/app_microservice/backend
docker build -f Dockerfile.item -t ${IMAGE_NAME}:${VERSION} .

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi

# Tag as latest
if [ "$VERSION" != "latest" ]; then
    docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest
fi

echo -e "${GREEN}✓ Build successful!${NC}"

# 3. Import to k3s
echo -e "\n${YELLOW}3. Importing to k3s...${NC}"
docker save ${IMAGE_NAME}:latest -o /tmp/${SERVICE_NAME}.tar
sudo k3s ctr images import /tmp/${SERVICE_NAME}.tar
rm /tmp/${SERVICE_NAME}.tar

echo -e "${GREEN}✓ Image imported${NC}"

# 4. Check replicas (must be ≥2 for zero downtime)
REPLICAS=$(kubectl -n $NAMESPACE get deployment $SERVICE_NAME -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
if [ "$REPLICAS" -lt 2 ]; then
    echo -e "${YELLOW}⚠ Warning: Replicas = ${REPLICAS}. Scaling to 2 for zero downtime...${NC}"
    kubectl -n $NAMESPACE scale deployment $SERVICE_NAME --replicas=2 2>/dev/null || true
    sleep 10
fi

# 5. Apply deployment (triggers rolling update)
echo -e "\n${YELLOW}4. Deploying with Rolling Update...${NC}"
kubectl apply -f k8s/base/item-deployment.yaml

# 6. Watch rollout status
echo -e "\n${YELLOW}5. Watching Rollout Progress...${NC}"
kubectl -n $NAMESPACE rollout status deployment $SERVICE_NAME --timeout=5m

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Deployment failed!${NC}"
    echo -e "${YELLOW}Rolling back...${NC}"
    kubectl -n $NAMESPACE rollout undo deployment $SERVICE_NAME
    exit 1
fi

echo -e "${GREEN}✓ Deployment successful!${NC}"

# 7. Verify pods
echo -e "\n${YELLOW}6. New Pod Status:${NC}"
kubectl -n $NAMESPACE get pods -l app=$SERVICE_NAME -o wide

# 8. Check logs
echo -e "\n${YELLOW}7. Recent Logs:${NC}"
kubectl -n $NAMESPACE logs -l app=$SERVICE_NAME --tail=20 2>/dev/null || echo "Logs not available yet"

# 9. Test endpoint
echo -e "\n${YELLOW}8. Testing API Endpoint...${NC}"
GATEWAY_IP=$(kubectl -n $NAMESPACE get svc gateway-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
if [ -n "$GATEWAY_IP" ]; then
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://${GATEWAY_IP}:3000/api/items 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
        echo -e "${GREEN}✓ API is responding (HTTP ${RESPONSE})${NC}"
    else
        echo -e "${YELLOW}⚠ API test inconclusive (HTTP ${RESPONSE})${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Gateway IP not found, skipping API test${NC}"
fi

# 10. Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"

echo -e "\n${BLUE}Rollout History:${NC}"
kubectl -n $NAMESPACE rollout history deployment $SERVICE_NAME

echo -e "\n${BLUE}Quick Commands:${NC}"
echo "  Watch pods:    kubectl -n $NAMESPACE get pods -l app=$SERVICE_NAME -w"
echo "  View logs:     kubectl -n $NAMESPACE logs -l app=$SERVICE_NAME -f"
echo "  Rollback:      kubectl -n $NAMESPACE rollout undo deployment $SERVICE_NAME"
if [ -n "$GATEWAY_IP" ]; then
    echo "  Test API:      curl http://${GATEWAY_IP}:3000/api/items"
fi

