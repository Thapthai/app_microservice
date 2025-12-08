#!/bin/bash

# ============================================
# 🔄 Frontend - Update Service Script
# ============================================
# ใช้สำหรับ: Update โค้ดใหม่ (มี deployment อยู่แล้ว)
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="frontend-pose:latest"
NAMESPACE="pose-microservices"
DEPLOYMENT_NAME="frontend"
API_URL="https://phc.dyndns.biz/medical-supplies-api/v1/"
BASE_PATH="/medical-supplies"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔄 UPDATE SERVICE - Frontend                     ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Build Docker Image with API URL
echo -e "${YELLOW}📦 Step 1/4: Building Docker image...${NC}"
echo -e "${CYAN}   → Building ${IMAGE_NAME}${NC}"
echo -e "${CYAN}   → API URL: ${API_URL}${NC}"
echo -e "${CYAN}   → Base Path: ${BASE_PATH}${NC}"
cd ..
docker build \
  --build-arg NEXT_PUBLIC_API_URL=${API_URL} \
  --build-arg NEXT_PUBLIC_BASE_PATH=${BASE_PATH} \
  -f docker/Dockerfile \
  -t ${IMAGE_NAME} \
  .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully!${NC}"
else
    echo -e "${RED}✗ Build failed!${NC}"
    exit 1
fi
echo ""

# Step 2: Import to K3s
echo -e "${YELLOW}📥 Step 2/4: Importing image to K3s...${NC}"
echo -e "${CYAN}   → Saving and importing ${IMAGE_NAME}${NC}"
docker save ${IMAGE_NAME} | sudo k3s ctr images import -

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Import completed successfully!${NC}"
else
    echo -e "${RED}✗ Import failed!${NC}"
    exit 1
fi
echo ""

# Step 3: Restart Deployment
echo -e "${YELLOW}🔄 Step 3/4: Restarting deployment...${NC}"
echo -e "${CYAN}   → Rolling restart ${DEPLOYMENT_NAME}${NC}"
kubectl rollout restart deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Restart initiated successfully!${NC}"
else
    echo -e "${RED}✗ Restart failed!${NC}"
    exit 1
fi
echo ""

# Step 4: Wait for Deployment
echo -e "${YELLOW}⏳ Step 4/4: Waiting for deployment to be ready...${NC}"
echo -e "${CYAN}   → Monitoring rollout status${NC}"
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE} --timeout=5m

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Deployment is ready!${NC}"
else
    echo -e "${RED}✗ Deployment rollout failed or timed out!${NC}"
    exit 1
fi
echo ""

# Show Status
echo -e "${YELLOW}📊 Final status:${NC}"
echo ""
echo -e "${CYAN}Pods:${NC}"
kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME}
echo ""

# Success Message
echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Update Completed Successfully!                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Next Steps
echo -e "${BLUE}📝 Next steps:${NC}"
echo -e "  • Check logs: ${YELLOW}kubectl logs -n ${NAMESPACE} -l app=${DEPLOYMENT_NAME} -f${NC}"
echo -e "  • Access frontend via Apache: ${YELLOW}https://phc.dyndns.biz/medical-supplies/${NC}"
echo -e "  • Access frontend via NodePort: ${YELLOW}http://10.11.9.84:30100/medical-supplies/${NC}"
echo -e "  • Clear browser cache: ${YELLOW}Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)${NC}"
echo ""

echo -e "${GREEN}🎉 Update completed at $(date '+%Y-%m-%d %H:%M:%S')${NC}"
