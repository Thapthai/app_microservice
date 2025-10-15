#!/bin/bash

# ========================================
# GitLab Runner Setup Script
# ========================================
# This script installs and configures GitLab Runner
# on Ubuntu/Debian systems with K3s

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  GitLab Runner Setup for POSE${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Please run this script as non-root user with sudo access${NC}"
    exit 1
fi

# Check OS
if [ ! -f /etc/os-release ]; then
    echo -e "${RED}❌ Cannot detect OS. This script supports Ubuntu/Debian only.${NC}"
    exit 1
fi

# ========================================
# Step 1: Install GitLab Runner
# ========================================
echo -e "${YELLOW}📦 Step 1: Installing GitLab Runner...${NC}"

# Add GitLab's official repository
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash

# Install GitLab Runner
sudo apt-get install -y gitlab-runner

# Check installation
if command -v gitlab-runner &> /dev/null; then
    RUNNER_VERSION=$(gitlab-runner --version | head -1)
    echo -e "${GREEN}✓ GitLab Runner installed: $RUNNER_VERSION${NC}"
else
    echo -e "${RED}❌ GitLab Runner installation failed${NC}"
    exit 1
fi

echo ""

# ========================================
# Step 2: Install kubectl
# ========================================
echo -e "${YELLOW}📦 Step 2: Installing kubectl...${NC}"

if command -v kubectl &> /dev/null; then
    echo -e "${BLUE}ℹ️  kubectl already installed${NC}"
else
    # Download kubectl
    curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
    
    # Install kubectl
    sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
    rm kubectl
    
    # Verify installation
    if command -v kubectl &> /dev/null; then
        echo -e "${GREEN}✓ kubectl installed${NC}"
    else
        echo -e "${RED}❌ kubectl installation failed${NC}"
        exit 1
    fi
fi

# Show version
kubectl version --client

echo ""

# ========================================
# Step 3: Configure Kubernetes Access
# ========================================
echo -e "${YELLOW}🔧 Step 3: Configuring Kubernetes access for GitLab Runner...${NC}"

# Create .kube directory for gitlab-runner user
sudo mkdir -p /home/gitlab-runner/.kube

# Copy K3s config
if [ -f /etc/rancher/k3s/k3s.yaml ]; then
    sudo cp /etc/rancher/k3s/k3s.yaml /home/gitlab-runner/.kube/config
    sudo chown gitlab-runner:gitlab-runner /home/gitlab-runner/.kube/config
    sudo chmod 600 /home/gitlab-runner/.kube/config
    echo -e "${GREEN}✓ Kubernetes config copied for gitlab-runner${NC}"
else
    echo -e "${YELLOW}⚠️  K3s config not found. Make sure K3s is installed.${NC}"
    echo -e "${YELLOW}   You can manually copy it later:${NC}"
    echo -e "${YELLOW}   sudo cp /etc/rancher/k3s/k3s.yaml /home/gitlab-runner/.kube/config${NC}"
fi

# Test kubectl access
if sudo -u gitlab-runner kubectl get nodes &> /dev/null; then
    echo -e "${GREEN}✓ GitLab Runner can access Kubernetes${NC}"
else
    echo -e "${YELLOW}⚠️  GitLab Runner cannot access Kubernetes yet${NC}"
fi

echo ""

# ========================================
# Step 4: Configure Docker Access
# ========================================
echo -e "${YELLOW}🐳 Step 4: Configuring Docker access for GitLab Runner...${NC}"

# Add gitlab-runner to docker group
sudo usermod -aG docker gitlab-runner

echo -e "${GREEN}✓ GitLab Runner added to docker group${NC}"
echo -e "${YELLOW}ℹ️  You may need to restart GitLab Runner service${NC}"

echo ""

# ========================================
# Step 5: Register Runner
# ========================================
echo -e "${YELLOW}🔐 Step 5: Register GitLab Runner${NC}"
echo ""
echo -e "${BLUE}To register the runner, you need:${NC}"
echo -e "  1. GitLab instance URL (e.g., https://gitlab.com)"
echo -e "  2. Registration token from: Settings > CI/CD > Runners"
echo ""

read -p "Do you want to register the runner now? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}Starting GitLab Runner registration...${NC}"
    echo ""
    
    sudo gitlab-runner register \
        --non-interactive \
        --url "https://gitlab.com" \
        --executor "docker" \
        --docker-image "docker:24-dind" \
        --docker-privileged \
        --docker-volumes "/var/run/docker.sock:/var/run/docker.sock" \
        --docker-volumes "/cache" \
        --tag-list "docker,kubernetes" || echo -e "${YELLOW}⚠️  Registration failed. You can register manually later.${NC}"
    
    echo ""
    echo -e "${GREEN}✓ Registration command executed${NC}"
else
    echo ""
    echo -e "${BLUE}You can register the runner later using:${NC}"
    echo ""
    echo "sudo gitlab-runner register"
    echo ""
    echo -e "${BLUE}Or with pre-filled values:${NC}"
    echo ""
    echo "sudo gitlab-runner register \\"
    echo "  --url https://gitlab.com \\"
    echo "  --registration-token YOUR_TOKEN \\"
    echo "  --description 'POSE Production Runner' \\"
    echo "  --tag-list 'docker,kubernetes' \\"
    echo "  --executor docker \\"
    echo "  --docker-image docker:24-dind \\"
    echo "  --docker-privileged \\"
    echo "  --docker-volumes '/var/run/docker.sock:/var/run/docker.sock' \\"
    echo "  --docker-volumes '/cache'"
    echo ""
fi

# ========================================
# Step 6: Configure Runner
# ========================================
echo -e "${YELLOW}⚙️  Step 6: Configuring GitLab Runner...${NC}"

# Backup original config
if [ -f /etc/gitlab-runner/config.toml ]; then
    sudo cp /etc/gitlab-runner/config.toml /etc/gitlab-runner/config.toml.backup
    echo -e "${GREEN}✓ Backed up existing config${NC}"
fi

# Update concurrent jobs
sudo sed -i 's/^concurrent = .*/concurrent = 4/' /etc/gitlab-runner/config.toml 2>/dev/null || true

echo -e "${GREEN}✓ Runner configuration updated${NC}"

echo ""

# ========================================
# Step 7: Start/Restart Services
# ========================================
echo -e "${YELLOW}🚀 Step 7: Starting GitLab Runner service...${NC}"

# Enable and start service
sudo systemctl enable gitlab-runner
sudo systemctl restart gitlab-runner

# Check status
sleep 2
if sudo systemctl is-active --quiet gitlab-runner; then
    echo -e "${GREEN}✓ GitLab Runner service is running${NC}"
else
    echo -e "${RED}❌ GitLab Runner service failed to start${NC}"
    echo -e "${YELLOW}Check status with: sudo systemctl status gitlab-runner${NC}"
fi

echo ""

# ========================================
# Summary
# ========================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Installation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check GitLab Runner
if command -v gitlab-runner &> /dev/null; then
    echo -e "${GREEN}✓ GitLab Runner: Installed${NC}"
    gitlab-runner --version | head -1
else
    echo -e "${RED}✗ GitLab Runner: Not found${NC}"
fi

echo ""

# Check kubectl
if command -v kubectl &> /dev/null; then
    echo -e "${GREEN}✓ kubectl: Installed${NC}"
    kubectl version --client --short 2>/dev/null || kubectl version --client
else
    echo -e "${RED}✗ kubectl: Not found${NC}"
fi

echo ""

# Check Runner status
if sudo systemctl is-active --quiet gitlab-runner; then
    echo -e "${GREEN}✓ GitLab Runner Service: Running${NC}"
else
    echo -e "${YELLOW}⚠️  GitLab Runner Service: Not running${NC}"
fi

echo ""

# List registered runners
echo -e "${BLUE}Registered Runners:${NC}"
sudo gitlab-runner list 2>/dev/null || echo "No runners registered yet"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Next Steps${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "1. Register runner (if not done):"
echo "   sudo gitlab-runner register"
echo ""
echo "2. Get registration token from GitLab:"
echo "   Settings > CI/CD > Runners"
echo ""
echo "3. Verify runner in GitLab:"
echo "   Settings > CI/CD > Runners > Available runners"
echo ""
echo "4. Test runner:"
echo "   Push code to GitLab and check pipeline"
echo ""
echo "5. View runner logs:"
echo "   sudo journalctl -u gitlab-runner -f"
echo ""
echo "6. Check runner config:"
echo "   sudo cat /etc/gitlab-runner/config.toml"
echo ""
echo "7. Restart runner if needed:"
echo "   sudo systemctl restart gitlab-runner"
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  GitLab Runner Setup Complete! 🎉${NC}"
echo -e "${GREEN}========================================${NC}"

