# 🚀 GitLab CI/CD Quick Start

Get your GitLab CI/CD up and running in 10 minutes!

---

## ⚡ Super Quick Setup (5 Steps)

### **Step 1: Create GitLab Project** (2 min)

```bash
# 1. Go to https://gitlab.com
# 2. Click "New Project" > "Create blank project"
# 3. Name: pose-microservices
# 4. Visibility: Private
# 5. Click "Create project"
```

### **Step 2: Push Code to GitLab** (2 min)

```bash
cd /path/to/app_microservice

# Add GitLab remote
git remote add gitlab https://gitlab.com/YOUR_USERNAME/pose-microservices.git

# Push code
git push gitlab main
git push gitlab develop
git push gitlab staging
```

### **Step 3: Install GitLab Runner** (3 min)

```bash
# On your server
cd /path/to/app_microservice
chmod +x scripts/setup-gitlab-runner.sh
./scripts/setup-gitlab-runner.sh
```

### **Step 4: Register Runner** (2 min)

```bash
# Get token from GitLab: Settings > CI/CD > Runners
# Copy the registration token

# Register runner
sudo gitlab-runner register \
  --url https://gitlab.com \
  --registration-token YOUR_TOKEN_HERE \
  --description "POSE Production Runner" \
  --tag-list "docker,kubernetes" \
  --executor docker \
  --docker-image docker:24-dind \
  --docker-privileged \
  --docker-volumes "/var/run/docker.sock:/var/run/docker.sock"
```

### **Step 5: Add CI/CD Variables** (1 min)

Go to **Settings > CI/CD > Variables** and add:

```
KUBE_NAMESPACE     = pose-microservices
DATABASE_URL       = mysql://user:pass@host:3306/db
JWT_SECRET         = your-secret-key
```

---

## ✅ Test Your Pipeline

```bash
# Create feature branch
git checkout -b feature/test-pipeline

# Make a small change
echo "# CI/CD Test" >> README.md

# Commit and push
git add .
git commit -m "test: CI/CD pipeline"
git push gitlab feature/test-pipeline
```

**Go to GitLab:** CI/CD > Pipelines

You should see your pipeline running! 🎉

---

## 🎯 Pipeline Flow

### **On Feature Branch:**
```
Push → Test → Build → ✅ Done
```

### **On Develop Branch:**
```
Push → Test → Build → Deploy to Dev → ✅ Done
```

### **On Staging Branch:**
```
Push → Test → Build → Deploy to Staging → ✅ Done
```

### **On Main Branch:**
```
Push → Test → Build → 🔘 Wait for Manual Approval → Deploy to Production → ✅ Done
```

---

## 📝 Common Commands

### **Check Pipeline Status**
```bash
# In GitLab UI
# Go to: CI/CD > Pipelines
```

### **View Runner Status**
```bash
# On server
sudo gitlab-runner status
sudo gitlab-runner list
```

### **View Runner Logs**
```bash
sudo journalctl -u gitlab-runner -f
```

### **Restart Runner**
```bash
sudo systemctl restart gitlab-runner
```

---

## 🐛 Quick Troubleshooting

### **Pipeline stuck on "Pending"**
```bash
# Check if runner is running
sudo systemctl status gitlab-runner

# Check if runner is registered
sudo gitlab-runner list

# Restart runner
sudo systemctl restart gitlab-runner
```

### **"kubectl: command not found"**
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### **"Cannot connect to Kubernetes"**
```bash
# Configure kubectl for gitlab-runner
sudo mkdir -p /home/gitlab-runner/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /home/gitlab-runner/.kube/config
sudo chown gitlab-runner:gitlab-runner /home/gitlab-runner/.kube/config
sudo chmod 600 /home/gitlab-runner/.kube/config
```

---

## 📚 Full Documentation

For detailed setup, see:
- **[GITLAB-CI-CD-SETUP.md](GITLAB-CI-CD-SETUP.md)** - Complete guide
- **[.gitlab-ci.yml](.gitlab-ci.yml)** - Pipeline configuration

---

## 🎉 You're Ready!

Your CI/CD pipeline is now configured!

**Next steps:**
1. ✅ Create feature branch
2. ✅ Make changes
3. ✅ Push to GitLab
4. ✅ Watch pipeline run
5. ✅ Merge to develop/staging/main

**Happy deploying! 🚀**

