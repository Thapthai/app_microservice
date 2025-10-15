# 🚀 GitLab CI/CD Setup Guide

Complete guide for setting up GitLab CI/CD pipeline for POSE Microservices.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [GitLab Setup](#gitlab-setup)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [GitLab Runner Setup](#gitlab-runner-setup)
6. [Environment Variables](#environment-variables)
7. [Deployment Strategy](#deployment-strategy)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

### **Pipeline Stages:**
```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  TEST   │ -> │  BUILD  │ -> │ DEPLOY  │ -> │ CLEANUP │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
```

### **What the Pipeline Does:**

1. **Test Stage:**
   - Install dependencies
   - Run linting
   - Run unit tests
   - Type checking (Frontend)

2. **Build Stage:**
   - Build Docker images for all services
   - Tag images with commit SHA and `latest`
   - Push to GitLab Container Registry

3. **Deploy Stage:**
   - Deploy to Development (automatic on `develop` branch)
   - Deploy to Staging (automatic on `staging` branch)
   - Deploy to Production (manual on `main`/`master` branch)
   - Update Kubernetes deployments
   - Wait for rollout completion

4. **Cleanup Stage:**
   - Clean old Docker images (manual)

---

## ✅ Prerequisites

### **1. GitLab Account & Project**
- GitLab.com account or self-hosted GitLab instance
- Project created on GitLab

### **2. Kubernetes Cluster**
- K3s/K8s cluster running
- kubectl configured

### **3. GitLab Runner**
- GitLab Runner installed on your server or K8s cluster
- Runner registered with appropriate tags

### **4. Tools on Runner**
- Docker
- kubectl
- Git

---

## 🔧 GitLab Setup

### **Step 1: Create Project on GitLab**

1. **Login to GitLab**
   ```
   https://gitlab.com
   ```

2. **Create New Project**
   - Click "New Project"
   - Choose "Create blank project"
   - Project name: `pose-microservices`
   - Visibility: Private (recommended)
   - Initialize with README: No (we already have one)

3. **Get Git Remote URL**
   ```
   https://gitlab.com/your-username/pose-microservices.git
   ```

### **Step 2: Push Code to GitLab**

```bash
cd /path/to/app_microservice

# Initialize git (if not already)
git init

# Add GitLab as remote
git remote add gitlab https://gitlab.com/your-username/pose-microservices.git

# Or if already have origin, rename it
git remote rename origin github
git remote add gitlab https://gitlab.com/your-username/pose-microservices.git

# Create and push branches
git checkout -b main
git add .
git commit -m "Initial commit with CI/CD setup"
git push gitlab main

# Create develop branch
git checkout -b develop
git push gitlab develop

# Create staging branch
git checkout -b staging
git push gitlab staging
```

### **Step 3: Enable Container Registry**

1. Go to **Settings > General > Visibility**
2. Enable **Container Registry**
3. Save changes

Your registry will be at:
```
registry.gitlab.com/your-username/pose-microservices
```

### **Step 4: Protect Branches**

1. Go to **Settings > Repository > Protected Branches**
2. Protect `main` branch:
   - Allowed to merge: Maintainers
   - Allowed to push: No one
3. Protect `develop` and `staging` similarly

---

## 🏃 GitLab Runner Setup

### **Option 1: Install on Server (Recommended for Production)**

#### **1. Install GitLab Runner**

```bash
# Add GitLab's official repository
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash

# Install GitLab Runner
sudo apt-get install gitlab-runner

# Check version
gitlab-runner --version
```

#### **2. Register Runner**

Get registration token:
- Go to **Settings > CI/CD > Runners**
- Copy the registration token

```bash
# Register runner
sudo gitlab-runner register

# Answer prompts:
# GitLab instance URL: https://gitlab.com
# Registration token: <YOUR_TOKEN>
# Description: POSE Production Runner
# Tags: docker,kubernetes
# Executor: docker
# Default Docker image: docker:24-dind
```

#### **3. Configure Runner**

Edit `/etc/gitlab-runner/config.toml`:

```toml
concurrent = 4
check_interval = 0

[session_server]
  session_timeout = 1800

[[runners]]
  name = "POSE Production Runner"
  url = "https://gitlab.com/"
  token = "YOUR_RUNNER_TOKEN"
  executor = "docker"
  [runners.custom_build_dir]
  [runners.cache]
    [runners.cache.s3]
    [runners.cache.gcs]
    [runners.cache.azure]
  [runners.docker]
    tls_verify = false
    image = "docker:24-dind"
    privileged = true
    disable_entrypoint_overwrite = false
    oom_kill_disable = false
    disable_cache = false
    volumes = ["/cache", "/var/run/docker.sock:/var/run/docker.sock"]
    shm_size = 0
```

#### **4. Install kubectl on Runner**

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify
kubectl version --client
```

#### **5. Configure Kubernetes Access**

```bash
# Copy K3s config to GitLab Runner
sudo mkdir -p /home/gitlab-runner/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /home/gitlab-runner/.kube/config
sudo chown gitlab-runner:gitlab-runner /home/gitlab-runner/.kube/config
sudo chmod 600 /home/gitlab-runner/.kube/config

# Test access
sudo -u gitlab-runner kubectl get nodes
```

---

### **Option 2: Install on Kubernetes**

```bash
# Add GitLab Helm repository
helm repo add gitlab https://charts.gitlab.io
helm repo update

# Install GitLab Runner
helm install gitlab-runner gitlab/gitlab-runner \
  --namespace gitlab-runner \
  --create-namespace \
  --set gitlabUrl=https://gitlab.com \
  --set runnerRegistrationToken=YOUR_TOKEN \
  --set runners.tags="docker,kubernetes" \
  --set rbac.create=true
```

---

## 🔐 Environment Variables

### **Required CI/CD Variables**

Go to **Settings > CI/CD > Variables** and add:

#### **1. Container Registry (Auto-provided by GitLab)**
- `CI_REGISTRY` - GitLab Container Registry URL (auto)
- `CI_REGISTRY_USER` - Username (auto)
- `CI_REGISTRY_PASSWORD` - Password (auto)
- `CI_REGISTRY_IMAGE` - Project image path (auto)

#### **2. Kubernetes Access**

**Option A: Using Service Account (Recommended)**

```bash
# Create service account
kubectl create serviceaccount gitlab-deploy -n pose-microservices

# Create role binding
kubectl create clusterrolebinding gitlab-deploy \
  --clusterrole=cluster-admin \
  --serviceaccount=pose-microservices:gitlab-deploy

# Get token
KUBE_TOKEN=$(kubectl create token gitlab-deploy -n pose-microservices --duration=8760h)

# Get CA certificate
kubectl get secret $(kubectl get sa gitlab-deploy -n pose-microservices -o jsonpath='{.secrets[0].name}') -n pose-microservices -o jsonpath='{.data.ca\.crt}' | base64 -d > ca.crt
```

Add to GitLab Variables:
- `KUBE_TOKEN` (Masked, Protected) = Service account token
- `KUBE_URL` = `https://your-k8s-api-server:6443`
- `KUBE_CA_PEM` (Masked) = Content of `ca.crt`

**Option B: Using Kubeconfig File**

```bash
# Get kubeconfig
cat ~/.kube/config
```

Add to GitLab Variables:
- `KUBE_CONFIG` (File, Masked, Protected) = Full kubeconfig content

#### **3. Application Secrets**

Add these as **Masked** and **Protected** variables:

```
DATABASE_URL          = mysql://user:pass@host:3306/db
JWT_SECRET           = your-super-secret-jwt-key
SMTP_HOST            = smtp.gmail.com
SMTP_PORT            = 587
SMTP_USER            = your-email@gmail.com
SMTP_PASSWORD        = your-app-password
REDIS_URL            = redis://redis:6379
```

#### **4. Deployment Settings**

```
KUBE_NAMESPACE       = pose-microservices
KUBE_CONTEXT         = production
```

---

## 🚀 CI/CD Pipeline

### **Pipeline Configuration**

The `.gitlab-ci.yml` file defines the pipeline with:

#### **Stages:**
1. **test** - Run tests and linting
2. **build** - Build Docker images
3. **deploy** - Deploy to environments
4. **cleanup** - Clean up resources

#### **Jobs:**

**Backend Jobs:**
- `backend:test` - Test backend code
- `backend:build:auth` - Build auth service
- `backend:build:gateway` - Build gateway service
- `backend:build:item` - Build item service
- `backend:build:email` - Build email service
- `backend:build:category` - Build category service

**Frontend Jobs:**
- `frontend:test` - Test frontend code
- `frontend:build` - Build frontend image

**Deployment Jobs:**
- `deploy:dev` - Auto deploy to dev (on `develop` branch)
- `deploy:staging` - Auto deploy to staging (on `staging` branch)
- `deploy:production` - Manual deploy to production (on `main` branch)

**Cleanup Jobs:**
- `cleanup:registry` - Manual cleanup of old images

### **Branch Strategy:**

```
┌─────────┐
│  main   │ ──> Production (manual deploy)
└────┬────┘
     │
┌────▼────┐
│ staging │ ──> Staging (auto deploy)
└────┬────┘
     │
┌────▼────┐
│ develop │ ──> Development (auto deploy)
└────┬────┘
     │
┌────▼────────┐
│  feature/*  │ ──> Test & Build only
└─────────────┘
```

---

## 📦 Deployment Strategy

### **Development Deployment**

```bash
# Create develop branch
git checkout -b develop

# Make changes
git add .
git commit -m "feat: add new feature"

# Push to trigger pipeline
git push gitlab develop
```

**Pipeline will:**
1. Run tests
2. Build images
3. **Automatically deploy to development**

### **Staging Deployment**

```bash
# Merge develop to staging
git checkout staging
git merge develop

# Push to trigger pipeline
git push gitlab staging
```

**Pipeline will:**
1. Run tests
2. Build images
3. **Automatically deploy to staging**

### **Production Deployment**

```bash
# Merge staging to main
git checkout main
git merge staging

# Push to trigger pipeline
git push gitlab main
```

**Pipeline will:**
1. Run tests
2. Build images
3. **Wait for manual approval**
4. Click "Deploy" button in GitLab UI
5. Deploy to production

### **Rollback Strategy**

```bash
# In GitLab UI: Go to Deployments > Environments > Production
# Click "Rollback" button

# Or manually via kubectl:
kubectl rollout undo deployment/auth-service -n pose-microservices
kubectl rollout undo deployment/gateway-api -n pose-microservices
kubectl rollout undo deployment/frontend -n pose-microservices
```

---

## 🔍 Monitoring Pipeline

### **View Pipeline Status**

1. Go to **CI/CD > Pipelines**
2. Click on pipeline number
3. View job logs

### **View Deployment Status**

1. Go to **Deployments > Environments**
2. See status of:
   - Development
   - Staging
   - Production

### **View Container Registry**

1. Go to **Deploy > Container Registry**
2. See all built images with tags

---

## 🐛 Troubleshooting

### **Issue: Pipeline Fails at Build Stage**

**Error:** `docker: command not found`

**Solution:**
```bash
# Check if Docker is installed on runner
docker --version

# Install Docker on runner
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

---

### **Issue: Cannot Push to Registry**

**Error:** `denied: access forbidden`

**Solution:**
```bash
# Check if Container Registry is enabled
# Go to Settings > General > Visibility > Container Registry

# Or manually login to test
docker login registry.gitlab.com
```

---

### **Issue: Deployment Fails - kubectl Not Found**

**Error:** `kubectl: command not found`

**Solution:**
```bash
# Install kubectl on GitLab Runner
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

---

### **Issue: Cannot Connect to Kubernetes**

**Error:** `The connection to the server localhost:8080 was refused`

**Solution:**
```bash
# Check KUBECONFIG
echo $KUBECONFIG

# Set KUBECONFIG for GitLab Runner
sudo mkdir -p /home/gitlab-runner/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /home/gitlab-runner/.kube/config
sudo chown gitlab-runner:gitlab-runner /home/gitlab-runner/.kube/config

# Test
sudo -u gitlab-runner kubectl get nodes
```

---

### **Issue: Runner Not Picking Up Jobs**

**Solution:**
```bash
# Check runner status
sudo gitlab-runner status

# Restart runner
sudo gitlab-runner restart

# Verify runner is registered
sudo gitlab-runner list

# Check tags match
# In .gitlab-ci.yml: tags: - docker
# In Runner settings: Tags should include "docker"
```

---

## 📊 Best Practices

### **1. Use Merge Requests**
- Always create merge requests for code review
- Require approval before merging to `main`
- Run pipeline on merge requests

### **2. Tag Releases**
```bash
# Create release tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push gitlab v1.0.0
```

### **3. Use Semantic Versioning**
- Major: Breaking changes
- Minor: New features
- Patch: Bug fixes

### **4. Monitor Pipeline Performance**
- Go to **CI/CD > Pipelines > Charts**
- Track success rate
- Monitor duration

### **5. Cache Dependencies**
```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/
```

### **6. Use Pipeline Schedules**
```
# Run tests nightly
# Go to CI/CD > Schedules
# Add schedule: 0 2 * * * (2 AM daily)
```

---

## 🎯 Quick Commands

### **View Pipeline**
```bash
# Clone from GitLab
git clone https://gitlab.com/your-username/pose-microservices.git

# Check pipeline status
# Visit: https://gitlab.com/your-username/pose-microservices/-/pipelines
```

### **Manual Deploy**
```bash
# Trigger manual deployment
# Go to: CI/CD > Pipelines > Click pipeline > Click "Play" on deploy:production
```

### **Check Deployed Version**
```bash
# Check running images in K8s
kubectl get deployment -n pose-microservices -o wide

# Check image tags
kubectl describe deployment auth-service -n pose-microservices | grep Image
```

---

## 📚 Additional Resources

- **GitLab CI/CD Docs:** https://docs.gitlab.com/ee/ci/
- **GitLab Runner Docs:** https://docs.gitlab.com/runner/
- **Kubernetes Deployment:** https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- **Docker Build:** https://docs.docker.com/engine/reference/commandline/build/

---

## ✅ Checklist

### **Initial Setup**
- [ ] Create GitLab project
- [ ] Push code to GitLab
- [ ] Enable Container Registry
- [ ] Setup protected branches
- [ ] Install GitLab Runner
- [ ] Register Runner with tags
- [ ] Configure kubectl on Runner
- [ ] Add CI/CD variables
- [ ] Test pipeline on feature branch

### **Before Going to Production**
- [ ] Test pipeline on develop branch
- [ ] Test deployment to staging
- [ ] Verify all services running in staging
- [ ] Run API tests
- [ ] Monitor resource usage
- [ ] Setup rollback strategy
- [ ] Document deployment process
- [ ] Train team on CI/CD workflow

---

**Your GitLab CI/CD is ready! 🚀**

Push your code and watch the magic happen! ✨

