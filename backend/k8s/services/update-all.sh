#!/bin/bash

# ============================================
# 🔄 Backend - Update All Services
# ============================================
# ใช้สำหรับ: อัพเดททุก Backend Services พร้อมกัน
# ============================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="pose-microservices"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🔄 UPDATE ALL BACKEND SERVICES                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

cd ../..

# Services to update
declare -A SERVICES
SERVICES=(
    ["gateway-api"]="docker/Dockerfile.gateway"
    ["item-service"]="docker/Dockerfile.item"
    ["auth-service"]="docker/Dockerfile.auth"
    ["category-service"]="docker/Dockerfile.category"
    ["email-service"]="docker/Dockerfile.email"
    ["department-service"]="docker/Dockerfile.department"
)

TOTAL_SERVICES=${#SERVICES[@]}
CURRENT=0
FAILED_SERVICES=()

for SERVICE in "${!SERVICES[@]}"; do
    CURRENT=$((CURRENT + 1))
    DOCKERFILE="${SERVICES[$SERVICE]}"
    IMAGE_NAME="backend-${SERVICE}:latest"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}[$CURRENT/$TOTAL_SERVICES] Processing: ${SERVICE}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Build
    echo -e "${YELLOW}📦 Building ${SERVICE}...${NC}"
    docker build -f ${DOCKERFILE} -t ${IMAGE_NAME} . > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Build completed${NC}"
    else
        echo -e "${RED}✗ Build failed!${NC}"
        FAILED_SERVICES+=("$SERVICE (build)")
        continue
    fi
    
    # Import
    echo -e "${YELLOW}📥 Importing to K3s...${NC}"
    docker save ${IMAGE_NAME} | sudo k3s ctr images import - > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Import completed${NC}"
    else
        echo -e "${RED}✗ Import failed!${NC}"
        FAILED_SERVICES+=("$SERVICE (import)")
        continue
    fi
    
    # Restart
    echo -e "${YELLOW}🔄 Restarting deployment...${NC}"
    kubectl rollout restart deployment/${SERVICE} -n ${NAMESPACE} > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Restart initiated${NC}"
    else
        echo -e "${RED}✗ Restart failed!${NC}"
        FAILED_SERVICES+=("$SERVICE (restart)")
        continue
    fi
    
    echo ""
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Wait for all rollouts
echo -e "${YELLOW}⏳ Waiting for all deployments to complete...${NC}"
echo ""

for SERVICE in "${!SERVICES[@]}"; do
    echo -e "${CYAN}Checking ${SERVICE}...${NC}"
    kubectl rollout status deployment/${SERVICE} -n ${NAMESPACE} --timeout=2m
    echo ""
done

# Show final status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}📊 Final Status:${NC}"
echo ""
kubectl get pods -n ${NAMESPACE}
echo ""

# Summary
if [ ${#FAILED_SERVICES[@]} -eq 0 ]; then
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ All Services Updated Successfully!            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ⚠️  Some Services Failed to Update               ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Failed services:${NC}"
    for FAILED in "${FAILED_SERVICES[@]}"; do
        echo -e "  ${RED}✗ ${FAILED}${NC}"
    done
fi

echo ""
echo -e "${GREEN}🎉 Completed at $(date '+%Y-%m-%d %H:%M:%S')${NC}"

