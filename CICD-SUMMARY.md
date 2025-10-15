# 📦 CI/CD Files Overview

## 🎯 ไฟล์ที่สร้างขึ้น:

### **1. `.gitlab-ci.yml`**
- 📄 **GitLab CI/CD Pipeline Configuration**
- ⚙️ กำหนด stages, jobs, และ deployment strategy
- 🏗️ รวม 15+ jobs สำหรับ test, build, deploy
- 📦 Support 5 backend services + 1 frontend

### **2. `GITLAB-CI-CD-SETUP.md`**
- 📚 **Complete Setup Guide** (30+ หน้า)
- 🔧 ครอบคลุมทุกขั้นตอนการตั้งค่า
- 🐛 Troubleshooting guide
- ✅ Production checklist

### **3. `GITLAB-QUICK-START.md`**
- ⚡ **Quick Start Guide** (5 steps, 10 minutes)
- 🚀 Get started quickly
- 📝 Common commands
- 🔍 Quick troubleshooting

### **4. `scripts/setup-gitlab-runner.sh`**
- 🤖 **Automated Runner Setup Script**
- 🔄 One-command installation
- ⚙️ Configure kubectl, Docker access
- ✅ Verify installation

---

## 🌊 CI/CD Workflow

```
┌──────────────┐
│ Push Code    │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Run Tests    │  ← Lint, Type Check, Unit Tests
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Build Images │  ← Docker builds for all services
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Deploy     │  ← Auto (dev/staging) or Manual (prod)
└──────────────┘
```

---

## 📋 Branch Strategy

```
main/master     → Production  (Manual Deploy)
     ↑
  staging       → Staging     (Auto Deploy)
     ↑
  develop       → Development (Auto Deploy)
     ↑
feature/*       → Test & Build Only
```

---

## 🎯 Quick Start

### **1. Setup (10 minutes)**
```bash
# 1. Create GitLab project
# 2. Push code: git push gitlab main
# 3. Run setup: ./scripts/setup-gitlab-runner.sh
# 4. Register runner with token
# 5. Add CI/CD variables in GitLab
```

### **2. First Pipeline**
```bash
git checkout -b feature/test
echo "test" >> README.md
git commit -am "test: CI/CD"
git push gitlab feature/test
```

### **3. Deploy to Production**
```bash
# Merge to main
git checkout main
git merge staging
git push gitlab main

# Go to GitLab UI
# Click "Deploy" button in pipeline
```

---

## 🔐 Required CI/CD Variables

Add in **Settings > CI/CD > Variables:**

```
KUBE_NAMESPACE        # pose-microservices
KUBE_TOKEN           # K8s service account token
DATABASE_URL         # MySQL connection string
JWT_SECRET          # JWT secret key
SMTP_HOST           # Email SMTP host
SMTP_USER           # Email username
SMTP_PASSWORD       # Email password
REDIS_URL           # Redis connection string
```

---

## 📊 Pipeline Jobs

### **Backend (5 services × 2 jobs = 10 jobs)**
- `backend:test` - Run tests
- `backend:build:auth` - Build auth service
- `backend:build:gateway` - Build gateway service
- `backend:build:item` - Build item service
- `backend:build:email` - Build email service
- `backend:build:category` - Build category service

### **Frontend (2 jobs)**
- `frontend:test` - Run tests
- `frontend:build` - Build image

### **Deploy (3 jobs)**
- `deploy:dev` - Deploy to development
- `deploy:staging` - Deploy to staging
- `deploy:production` - Deploy to production (manual)

### **Cleanup (1 job)**
- `cleanup:registry` - Clean old images (manual)

---

## 🎨 Features

✅ **Automated Testing**
- Lint checking
- Type checking
- Unit tests
- Build verification

✅ **Docker Image Building**
- Multi-stage builds
- Optimized layers
- Tag with commit SHA
- Push to GitLab Registry

✅ **Kubernetes Deployment**
- Rolling updates
- Zero downtime
- Auto rollback on failure
- Health checks

✅ **Branch-based Deployment**
- develop → Development
- staging → Staging
- main → Production (manual)

✅ **Caching**
- Node modules caching
- Faster pipeline runs

✅ **Artifacts**
- Test results
- Coverage reports
- Build logs

---

## 📚 Documentation Files

1. **GITLAB-QUICK-START.md** ← Start here!
2. **GITLAB-CI-CD-SETUP.md** ← Complete guide
3. **.gitlab-ci.yml** ← Pipeline config
4. **scripts/setup-gitlab-runner.sh** ← Runner setup

---

## 🔍 Useful Commands

### **On Server:**
```bash
# Check runner
sudo gitlab-runner status
sudo gitlab-runner list

# View logs
sudo journalctl -u gitlab-runner -f

# Restart
sudo systemctl restart gitlab-runner
```

### **In GitLab UI:**
```
CI/CD > Pipelines          # View pipeline status
CI/CD > Jobs               # View job logs
Deployments > Environments # View deployments
Deploy > Container Registry # View images
```

---

## 🎉 Benefits

✅ **Automation**
- No manual deployment
- Consistent process
- Reduce human error

✅ **Speed**
- Fast feedback
- Parallel builds
- Quick rollback

✅ **Quality**
- Automated tests
- Code linting
- Type checking

✅ **Traceability**
- Every deploy tracked
- Easy rollback
- Audit trail

✅ **Safety**
- Test before deploy
- Manual approval for production
- Automatic rollback on failure

---

## 🚀 Ready to Use!

Your GitLab CI/CD pipeline is fully configured and ready to use!

**Start with:** [GITLAB-QUICK-START.md](GITLAB-QUICK-START.md)

**Happy Deploying! 🎯**
