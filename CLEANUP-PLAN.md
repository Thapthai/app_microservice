# 🧹 Cleanup Plan - ไฟล์ที่ไม่จำเป็น

## 📋 สถานะปัจจุบัน

**โครงสร้าง:** Monorepo (backend + frontend ใน repo เดียว)
**สถานะ:** Backend & Frontend deploy แยกกันใน K8s แล้ว ✅

---

## 🗑️ ไฟล์ที่ควรลบ (Duplicates & Unnecessary)

### **Root Level - Documentation ซ้ำซ้อน:**

```
❌ CICD-SUMMARY.md                    → ย้ายเนื้อหาเข้า GITLAB-QUICK-START.md แล้วลบ
❌ .gitlab-ci-original.yml            → สำรอง, ไม่ต้องใช้แล้ว
⚠️ SPLIT-REPOS-GUIDE.md               → เก็บไว้เผื่ออนาคต (ไม่ลบ)
⚠️ .gitlab-ci-optimized.yml           → เก็บไว้ใช้ทดแทน .gitlab-ci.yml (ไม่ลบ)
```

### **Backend - Documentation ซ้ำซ้อน:**

```
❌ backend/README-MICROSERVICES.md    → ซ้ำกับ backend/README.md
❌ backend/SINGLE-PORT-SETUP.md       → ไม่ได้ใช้ (ใช้ multi-port อยู่แล้ว)
⚠️ backend/EXTERNAL-DATABASE-SETUP.md → เก็บไว้ (reference)
⚠️ backend/JWT-AUTH-GUARD-GUIDE.md    → เก็บไว้ (reference)
⚠️ backend/USER-MANAGEMENT-API-GUIDE.md → เก็บไว้ (reference)
⚠️ backend/API-TESTING-SCENARIOS.md   → เก็บไว้ (สำคัญ)
```

### **Frontend - Documentation ซ้ำซ้อน:**

```
⚠️ frontend/DOCKER-K8S-SETUP.md       → เก็บไว้ (reference)
⚠️ frontend/DEPLOYMENT-GUIDE.md       → เก็บไว้ (reference)
```

### **K8s Monitoring:**

```
⚠️ backend/k8s/monitoring/*.md         → เก็บทั้งหมด (สำคัญ)
✅ backend/k8s/monitoring/grafana-database-dashboard.json → เพิ่มใหม่
✅ backend/k8s/monitoring/GRAFANA-DATABASE-GUIDE.md → เพิ่งสร้าง
```

---

## ✅ แผนทำความสะอาด

### **Phase 1: ลบไฟล์ซ้ำซ้อน**

```bash
# 1. ลบ CICD-SUMMARY.md (ย้ายเนื้อหาไปแล้ว)
rm CICD-SUMMARY.md

# 2. ลบ README-MICROSERVICES.md (ซ้ำกับ README.md)
rm backend/README-MICROSERVICES.md

# 3. ลบ SINGLE-PORT-SETUP.md (ไม่ได้ใช้)
rm backend/SINGLE-PORT-SETUP.md
```

### **Phase 2: จัดระเบียบ Documentation**

**Root Level (เก็บเฉพาะจำเป็น):**
```
✅ README.md                          → Main project overview
✅ .gitlab-ci.yml                     → CI/CD pipeline (active)
✅ .gitlab-ci-optimized.yml           → CI/CD optimized version
✅ GITLAB-CI-CD-SETUP.md             → Complete setup guide
✅ GITLAB-QUICK-START.md             → Quick start guide
✅ DEPLOYMENT-SUMMARY.md             → Quick deployment reference
✅ FULL-STACK-DEPLOYMENT.md          → Full deployment guide
✅ SPLIT-REPOS-GUIDE.md              → Future reference (แยก repos)
```

**Backend Documentation:**
```
✅ backend/README.md                  → Backend overview
✅ backend/API-TESTING-SCENARIOS.md   → API testing
✅ backend/JWT-AUTH-GUARD-GUIDE.md    → Auth reference
✅ backend/USER-MANAGEMENT-API-GUIDE.md → User API reference
✅ backend/EXTERNAL-DATABASE-SETUP.md → Database setup
```

**Frontend Documentation:**
```
✅ frontend/README.md                 → Frontend overview
✅ frontend/DEPLOYMENT-GUIDE.md       → Deployment guide
✅ frontend/DOCKER-K8S-SETUP.md       → Docker/K8s reference
```

**Monitoring Documentation:**
```
✅ backend/k8s/monitoring/README.md
✅ backend/k8s/monitoring/DEPLOYMENT-GUIDE.md
✅ backend/k8s/monitoring/PROMETHEUS-MINIMAL-GUIDE.md
✅ backend/k8s/monitoring/nestjs-metrics-setup.md
✅ backend/k8s/monitoring/GRAFANA-DATABASE-GUIDE.md    → เพิ่งสร้าง
```

---

## 📊 สรุปไฟล์ที่จะลบ

### **ควรลบ (3 ไฟล์):**
1. ❌ `CICD-SUMMARY.md` - เนื้อหาซ้ำกับ GITLAB-QUICK-START.md
2. ❌ `backend/README-MICROSERVICES.md` - ซ้ำกับ backend/README.md
3. ❌ `backend/SINGLE-PORT-SETUP.md` - ไม่ได้ใช้งาน

### **Optional - สำรอง (อาจลบได้):**
1. ⚠️ `.gitlab-ci-original.yml` - ถ้าเก็บไว้อ้างอิง (แนะนำเปลี่ยนชื่อเป็น `.gitlab-ci.backup.yml`)

---

## 🎯 ข้อเสนอแนะ

### **1. Merge Documentation**

**ย้าย CICD-SUMMARY.md → GITLAB-QUICK-START.md:**
- เพิ่มส่วน "Overview" และ "Features" เข้าไป
- ลบ CICD-SUMMARY.md

**ย้าย README-MICROSERVICES.md → README.md:**
- รวมเนื้อหาเข้า backend/README.md
- ลบ README-MICROSERVICES.md

---

### **2. Rename for Clarity**

```bash
# เปลี่ยนชื่อไฟล์สำรอง
mv .gitlab-ci-original.yml .gitlab-ci.backup.yml

# เปลี่ยนชื่อ optimized → main (ถ้าต้องการใช้เป็นหลัก)
mv .gitlab-ci.yml .gitlab-ci.full.yml
mv .gitlab-ci-optimized.yml .gitlab-ci.yml
```

---

### **3. Create docs/ Folder** (Optional)

จัดระเบียบ documentation:

```bash
mkdir -p docs/deployment
mkdir -p docs/ci-cd
mkdir -p docs/monitoring

# Move files
mv FULL-STACK-DEPLOYMENT.md docs/deployment/
mv DEPLOYMENT-SUMMARY.md docs/deployment/
mv GITLAB-*.md docs/ci-cd/
mv backend/k8s/monitoring/*.md docs/monitoring/
```

**โครงสร้างใหม่:**
```
app_microservice/
├── README.md
├── .gitlab-ci.yml
├── docs/
│   ├── deployment/
│   │   ├── FULL-STACK-DEPLOYMENT.md
│   │   └── DEPLOYMENT-SUMMARY.md
│   ├── ci-cd/
│   │   ├── GITLAB-CI-CD-SETUP.md
│   │   ├── GITLAB-QUICK-START.md
│   │   └── SPLIT-REPOS-GUIDE.md
│   └── monitoring/
│       ├── README.md
│       ├── DEPLOYMENT-GUIDE.md
│       └── GRAFANA-DATABASE-GUIDE.md
├── backend/
└── frontend/
```

---

## 🚀 Execute Cleanup

ต้องการให้ดำเนินการลบไฟล์ทันทีไหม?

**Option A: ลบไฟล์ที่แนะนำ (3 ไฟล์)**
```bash
rm CICD-SUMMARY.md
rm backend/README-MICROSERVICES.md
rm backend/SINGLE-PORT-SETUP.md
```

**Option B: จัดระเบียบเป็น docs/ folder**
```bash
# สร้างโครงสร้าง docs/
mkdir -p docs/{deployment,ci-cd,monitoring}

# ย้ายไฟล์
mv FULL-STACK-DEPLOYMENT.md docs/deployment/
mv DEPLOYMENT-SUMMARY.md docs/deployment/
mv GITLAB-CI-CD-SETUP.md docs/ci-cd/
mv GITLAB-QUICK-START.md docs/ci-cd/
mv SPLIT-REPOS-GUIDE.md docs/ci-cd/
```

**Option C: ทั้งสองอย่าง (Clean + Organize)**

---

## 💡 คำแนะนำ

**สำหรับโปรเจกต์ POSE:**

### **แนะนำ: Option A (ลบไฟล์ซ้ำซ้อน)**

**เหตุผล:**
- ✅ เก็บ documentation ไว้ที่เดิม (ตาม structure ของ K8s/Docker)
- ✅ ไม่ต้องเปลี่ยนโครงสร้างใหญ่
- ✅ ลบเฉพาะที่ซ้ำซ้อนจริงๆ
- ✅ ไม่กระทบ reference ใน README

---

**ต้องการให้ดำเนินการไหมครับ?**

พิมพ์:
- "A" → ลบไฟล์ที่แนะนำ (3 ไฟล์)
- "B" → จัดระเบียบเป็น docs/ folder
- "C" → ทั้งสองอย่าง
- "ไม่" → ไม่ต้องลบ (เก็บไว้ทั้งหมด)

