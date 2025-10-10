#!/bin/bash

# Deploy all services with zero downtime
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

SERVICES=("auth" "item" "category" "email" "gateway")
NAMESPACE="pose-microservices"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Deploy All Services (Zero Downtime)${NC}"
echo -e "${BLUE}=========================================${NC}"

cd /var/www/app_microservice/backend

for service in "${SERVICES[@]}"; do
    echo ""
    echo -e "${YELLOW}>>> Deploying ${service}-service...${NC}"
    
    # Build
    echo "  Building..."
    docker build -f Dockerfile.${service} -t backend-${service}-service:latest . > /dev/null 2>&1
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}  ✗ Build failed for ${service}-service${NC}"
        continue
    fi
    
    # Import to k3s
    echo "  Importing to k3s..."
    docker save backend-${service}-service:latest -o /tmp/${service}.tar
    sudo k3s ctr images import /tmp/${service}.tar > /dev/null 2>&1
    rm /tmp/${service}.tar
    
    # Deploy
    echo "  Applying deployment..."
    kubectl apply -f k8s/base/${service}-deployment.yaml > /dev/null 2>&1
    
    echo -e "${GREEN}  ✓ ${service}-service deployment triggered${NC}"
done

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}  Watching Rollout Status${NC}"
echo -e "${BLUE}=========================================${NC}"

for service in "${SERVICES[@]}"; do
    echo ""
    echo -e "${YELLOW}>>> ${service}-service:${NC}"
    kubectl -n $NAMESPACE rollout status deployment ${service}-service --timeout=5m &
done

wait

echo ""
echo -e "${GREEN}✓ All services deployed successfully!${NC}"

# Show final status
echo ""
echo -e "${BLUE}Final Status:${NC}"
kubectl -n $NAMESPACE get pods

echo ""
echo -e "${BLUE}Services:${NC}"
kubectl -n $NAMESPACE get svc

