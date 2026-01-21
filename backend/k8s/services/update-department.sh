#!/bin/bash

# ============================================
# 🔄 Backend - Update Department Service
# ============================================
# ใช้สำหรับ: อัพเดท Department Service
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="backend-department-service:latest"
NAMESPACE="pose-microservices"
DEPLOYMENT_NAME="department-service"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔄 UPDATE SERVICE - Department Service          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Build Docker Image
echo -e "${YELLOW}📦 Step 1/5: Building new Docker image...${NC}"
echo -e "${CYAN}   → Building ${IMAGE_NAME}${NC}"
cd ../..
docker build -f docker/Dockerfile.department -t ${IMAGE_NAME} .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully!${NC}"
else
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi
echo ""

# Step 2: Verify Image
echo -e "${YELLOW}🔍 Step 2/5: Verifying Docker image...${NC}"
echo -e "${CYAN}   → Checking image exists${NC}"
docker images | grep backend-department-service
echo -e "${GREEN}✓ Image verified!${NC}"
echo ""

# Step 3: Import to K3s
echo -e "${YELLOW}📥 Step 3/5: Importing image to K3s...${NC}"
echo -e "${CYAN}   → Saving and importing ${IMAGE_NAME}${NC}"
docker save ${IMAGE_NAME} | sudo k3s ctr images import -

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Import completed successfully!${NC}"
else
    echo -e "${RED}✗ Import failed!${NC}"
    exit 1
fi
echo ""

# Step 4: Verify Import in K3s
echo -e "${YELLOW}🔍 Step 4/5: Verifying image in K3s...${NC}"
echo -e "${CYAN}   → Checking K3s containerd registry${NC}"
sudo k3s ctr images ls | grep backend-department-service
echo -e "${GREEN}✓ Image verified in K3s!${NC}"
echo ""

# Step 5: Restart Deployment
echo -e "${YELLOW}🔄 Step 5/5: Restarting deployment...${NC}"
echo -e "${CYAN}   → Triggering rollout restart${NC}"
kubectl rollout restart deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Restart initiated successfully!${NC}"
else
    echo -e "${RED}✗ Restart failed!${NC}"
    exit 1
fi
echo ""

# Monitor Progress
echo -e "${YELLOW}⏳ Monitoring rollout progress...${NC}"
echo -e "${CYAN}   → Watching deployment status${NC}"
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=5m

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Rollout completed successfully!${NC}"
else
    echo -e "${RED}✗ Rollout failed or timed out!${NC}"
    exit 1
fi
echo ""

# Show New Pods
echo -e "${YELLOW}📊 Checking new pods...${NC}"
kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME}
echo ""

# Success Message
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Department Service Update Completed!          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Next Steps
echo -e "${BLUE}📝 Useful commands:${NC}"
echo -e "  • Check logs: ${YELLOW}kubectl logs -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME} -f${NC}"
echo -e "  • Check status: ${YELLOW}kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME}${NC}"
echo -e "  • Rollback if needed: ${YELLOW}kubectl rollout undo deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}${NC}"
echo ""

echo -e "${GREEN}🎉 Update completed at $(date '+%Y-%m-%d %H:%M:%S')${NC}"
