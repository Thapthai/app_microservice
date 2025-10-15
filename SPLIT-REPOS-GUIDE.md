# 🔀 Split Repositories Guide

Guide for splitting POSE Microservices into separate Backend and Frontend repositories.

---

## 📋 Table of Contents
1. [Why Split?](#why-split)
2. [Repository Structure](#repository-structure)
3. [Setup Instructions](#setup-instructions)
4. [CI/CD for Separate Repos](#cicd-for-separate-repos)
5. [Version Management](#version-management)
6. [API Contract](#api-contract)

---

## 🎯 Why Split?

### **Current Setup (Monorepo):**
```
pose-microservices/
├── backend/
└── frontend/
```

**Pipeline:** Frontend change → Build ALL → Deploy ALL (ช้า 😞)

### **After Split (Multi-repo):**
```
pose-backend/
pose-frontend/
```

**Pipeline:** Frontend change → Build Frontend ONLY → Deploy Frontend ONLY (เร็ว 🚀)

---

## 📁 Repository Structure

### **Repository 1: Backend (pose-backend)**

```
pose-backend/
├── .gitlab-ci.yml              # Backend CI/CD only
├── README.md
├── apps/
│   ├── auth-service/
│   ├── gateway-api/
│   ├── item-service/
│   ├── email-service/
│   └── category-service/
├── libs/
│   └── metrics/
├── docker/
│   ├── Dockerfile.auth
│   ├── Dockerfile.gateway
│   ├── Dockerfile.item
│   ├── Dockerfile.email
│   ├── Dockerfile.category
│   └── docker-compose.yml
├── k8s/
│   ├── base/
│   └── monitoring/
├── prisma/
├── package.json
├── Makefile
├── API-TESTING-SCENARIOS.md
└── DEPLOYMENT-GUIDE.md
```

### **Repository 2: Frontend (pose-frontend)**

```
pose-frontend/
├── .gitlab-ci.yml              # Frontend CI/CD only
├── README.md
├── src/
│   ├── app/
│   ├── components/
│   ├── contexts/
│   ├── lib/
│   └── types/
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md
├── k8s/
│   ├── frontend-deployment.yaml
│   └── README.md
├── public/
├── package.json
├── Makefile
├── next.config.js
└── DEPLOYMENT-GUIDE.md
```

---

## 🔧 Setup Instructions

### **Step 1: Create GitLab Projects**

```bash
# On GitLab.com or your GitLab instance:
# 1. Create "pose-backend" project
# 2. Create "pose-frontend" project
```

### **Step 2: Split Current Repository**

#### **For Backend:**

```bash
# Clone current repo
cd /tmp
git clone /path/to/app_microservice pose-backend-temp

# Remove frontend
cd pose-backend-temp
rm -rf frontend
git add -A
git commit -m "chore: remove frontend for split"

# Move backend to root
mv backend/* .
mv backend/.* . 2>/dev/null || true
rm -rf backend
git add -A
git commit -m "chore: move backend to root"

# Add GitLab remote and push
git remote add gitlab https://gitlab.com/YOUR_USERNAME/pose-backend.git
git push gitlab main
git push gitlab develop
git push gitlab staging

# Cleanup
cd ..
rm -rf pose-backend-temp
```

#### **For Frontend:**

```bash
# Clone current repo
cd /tmp
git clone /path/to/app_microservice pose-frontend-temp

# Remove backend
cd pose-frontend-temp
rm -rf backend
git add -A
git commit -m "chore: remove backend for split"

# Move frontend to root
mv frontend/* .
mv frontend/.* . 2>/dev/null || true
rm -rf frontend
git add -A
git commit -m "chore: move frontend to root"

# Add GitLab remote and push
git remote add gitlab https://gitlab.com/YOUR_USERNAME/pose-frontend.git
git push gitlab main
git push gitlab develop
git push gitlab staging

# Cleanup
cd ..
rm -rf pose-frontend-temp
```

### **Step 3: Update CI/CD Configurations**

**Backend `.gitlab-ci.yml`:** (Simplified)

```yaml
stages:
  - test
  - build
  - deploy

variables:
  REGISTRY: $CI_REGISTRY
  REGISTRY_USER: $CI_REGISTRY_USER
  REGISTRY_PASSWORD: $CI_REGISTRY_PASSWORD
  AUTH_IMAGE: $CI_REGISTRY_IMAGE/auth-service
  GATEWAY_IMAGE: $CI_REGISTRY_IMAGE/gateway-api
  ITEM_IMAGE: $CI_REGISTRY_IMAGE/item-service
  EMAIL_IMAGE: $CI_REGISTRY_IMAGE/email-service
  CATEGORY_IMAGE: $CI_REGISTRY_IMAGE/category-service

test:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm run lint || true
    - npm run test || true

build:auth:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  script:
    - docker login -u $REGISTRY_USER -p $REGISTRY_PASSWORD $REGISTRY
    - docker build --target production -f docker/Dockerfile.auth -t $AUTH_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $AUTH_IMAGE:$CI_COMMIT_SHORT_SHA

# Similar for other services...

deploy:production:
  stage: deploy
  image: bitnami/kubectl:latest
  only:
    - main
  when: manual
  script:
    - kubectl set image deployment/auth-service auth-service=$AUTH_IMAGE:$CI_COMMIT_SHORT_SHA -n pose-microservices
    # Update other services...
```

**Frontend `.gitlab-ci.yml`:** (Simplified)

```yaml
stages:
  - test
  - build
  - deploy

variables:
  REGISTRY: $CI_REGISTRY
  REGISTRY_USER: $CI_REGISTRY_USER
  REGISTRY_PASSWORD: $CI_REGISTRY_PASSWORD
  FRONTEND_IMAGE: $CI_REGISTRY_IMAGE/frontend

test:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm run type-check
    - npm run lint || true
    - npm run build

build:
  stage: build
  image: docker:24-dind
  services:
    - docker:24-dind
  script:
    - docker login -u $REGISTRY_USER -p $REGISTRY_PASSWORD $REGISTRY
    - docker build -f docker/Dockerfile -t $FRONTEND_IMAGE:$CI_COMMIT_SHORT_SHA .
    - docker push $FRONTEND_IMAGE:$CI_COMMIT_SHORT_SHA

deploy:production:
  stage: deploy
  image: bitnami/kubectl:latest
  only:
    - main
  when: manual
  script:
    - kubectl set image deployment/frontend frontend=$FRONTEND_IMAGE:$CI_COMMIT_SHORT_SHA -n pose-microservices
```

---

## 🔄 Version Management

### **Strategy 1: Independent Versioning**

**Backend:**
```
v1.0.0, v1.1.0, v1.2.0, v2.0.0
```

**Frontend:**
```
v1.0.0, v1.0.1, v1.1.0, v1.2.0
```

**ข้อดี:**
- แต่ละส่วนมี version เป็นของตัวเอง
- Deploy อิสระกันได้

**ข้อเสีย:**
- ต้องจำว่า version ไหนใช้ด้วยกัน

---

### **Strategy 2: Synchronized Versioning**

**Backend & Frontend:**
```
v1.0.0 (Release together)
v1.1.0 (Release together)
```

**ข้อดี:**
- รู้ว่า version เท่ากันใช้ด้วยกันได้
- ง่ายต่อการจัดการ release

**ข้อเสีย:**
- ต้อง release พร้อมกัน (แม้จะเปลี่ยนแค่ส่วนเดียว)

---

### **Strategy 3: API Version + Independent (แนะนำ!)**

**Backend:**
```
API Version: v1, v2
Service Version: v1.0.0, v1.1.0
```

**Frontend:**
```
Targets API: v1
Version: v1.0.0, v1.1.0
```

**ข้อดี:**
- Deploy อิสระกันได้
- รู้ว่าใช้ API version ไหน
- Backward compatible

---

## 📝 API Contract

### **Create API Documentation Repository**

**Option 1: OpenAPI/Swagger Spec**

```yaml
# api-contract/openapi.yaml
openapi: 3.0.0
info:
  title: POSE API
  version: 1.0.0
paths:
  /api/auth/login:
    post:
      summary: User login
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Success
```

**Option 2: GraphQL Schema**

```graphql
# api-contract/schema.graphql
type User {
  id: ID!
  email: String!
  name: String!
}

type Query {
  me: User
  users: [User]
}

type Mutation {
  login(email: String!, password: String!): AuthResponse
}
```

**Option 3: Shared Types (TypeScript)**

```typescript
// api-contract/types.ts
export interface User {
  id: number;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}
```

**Store in:**
- Separate Git repository
- npm package (private registry)
- GitLab Package Registry

---

## 🔐 Environment Variables

### **Backend Environment**

```bash
# pose-backend/.env.example
DATABASE_URL=mysql://user:pass@host:3306/db
JWT_SECRET=your-secret-key
REDIS_URL=redis://redis:6379
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASSWORD=password
NODE_ENV=production
```

### **Frontend Environment**

```bash
# pose-frontend/.env.example
NEXT_PUBLIC_API_URL=http://10.11.9.84:3000/api
NODE_ENV=production
PORT=3100
```

---

## 🚀 Deployment Workflow

### **Scenario 1: Frontend Change Only**

```bash
# In pose-frontend repo
git checkout -b feature/update-ui
# Make changes...
git commit -am "feat: update UI"
git push gitlab feature/update-ui

# Pipeline: Test → Build Frontend → Deploy Frontend
# Backend: Unchanged ✅
```

### **Scenario 2: Backend Change Only**

```bash
# In pose-backend repo
git checkout -b feature/new-api
# Make changes...
git commit -am "feat: add new API"
git push gitlab feature/new-api

# Pipeline: Test → Build Backend → Deploy Backend
# Frontend: Unchanged ✅
```

### **Scenario 3: Both Change (Breaking API)**

```bash
# 1. Update API contract first
# 2. Deploy Backend with new API (maintain backward compatibility)
# 3. Deploy Frontend with new API call
# 4. Remove old API from Backend (next release)
```

---

## 📊 Comparison

| Feature | Monorepo | Multi-repo |
|---------|----------|------------|
| **Setup** | ✅ Easy | ⚠️ Complex |
| **Deployment** | ⚠️ All together | ✅ Independent |
| **Pipeline Speed** | ⚠️ Slower | ✅ Faster |
| **Team Work** | ⚠️ Merge conflicts | ✅ Less conflicts |
| **Version Control** | ⚠️ Complex | ✅ Clear |
| **API Contract** | ✅ In sync | ⚠️ Need management |
| **Small Team** | ✅ Good | ⚠️ Overhead |
| **Large Team** | ⚠️ Bottleneck | ✅ Scalable |

---

## ✅ Recommendation

### **Use Monorepo (Current) if:**
- ✅ Team size: 1-4 people
- ✅ Full-stack developers
- ✅ Simple deployment
- ✅ Tight coupling between frontend/backend

### **Use Multi-repo (Split) if:**
- ✅ Team size: 5+ people
- ✅ Separate frontend/backend teams
- ✅ Frequent independent deployments
- ✅ Need isolation and scalability

---

## 🎯 Your Case (POSE Microservices):

**Current Situation:**
- ทำงานคนเดียว/ทีมเล็ก ✅
- Backend & Frontend deploy แยกอยู่แล้ว ✅
- มี microservices architecture ✅

**Recommendation:**

### **Option A: Keep Monorepo + Optimize CI/CD (แนะนำตอนนี้)**
```yaml
# Use `only: changes:` in .gitlab-ci.yml
backend:build:
  only:
    changes:
      - backend/**/*

frontend:build:
  only:
    changes:
      - frontend/**/*
```

**ข้อดี:**
- ไม่ต้องแยก repo
- Pipeline จะ build เฉพาะส่วนที่เปลี่ยนเท่านั้น
- จัดการง่ายสำหรับทีมเล็ก

---

### **Option B: Split Repos (ถ้าทีมใหญ่ขึ้น/แบ่งทีม)**

**เมื่อไหร่ควรแยก:**
- ✅ มีคน 5+ คน
- ✅ แบ่งเป็น frontend team / backend team
- ✅ Deploy แยกอยู่แล้ว และบ่อยมาก
- ✅ มีปัญหา merge conflict บ่อย

**วิธีแยก:** ตามขั้นตอนใน [Setup Instructions](#setup-instructions)

---

## 📚 Additional Resources

- **Monorepo Tools:** Nx, Turborepo, Lerna
- **API Contract:** OpenAPI, GraphQL, gRPC
- **Version Management:** Semantic Versioning (semver.org)

---

## 🎉 Conclusion

**สำหรับโปรเจกต์ POSE:**

ตอนนี้ **ยังไม่แนะนำให้แยก** เพราะ:
1. ✅ ทีมเล็ก (สามารถจัดการได้ง่าย)
2. ✅ Full-stack development
3. ✅ สามารถ optimize CI/CD ใน monorepo ได้

**แต่ถ้าในอนาคต:**
- มีคนทำงานมากขึ้น (5+ คน)
- แบ่งเป็น frontend/backend team
- Deploy บ่อยและแยกกันชัดเจน

**ก็ควรพิจารณาแยกเป็น 2 repos**

**ตอนนี้แนะนำ:** ใช้ Monorepo + Optimize CI/CD with `only: changes:`

---

**Questions? Need help splitting? Let me know! 🚀**

