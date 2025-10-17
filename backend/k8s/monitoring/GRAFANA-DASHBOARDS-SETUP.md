# 📊 Grafana Dashboards Setup Guide

คู่มือการตั้งค่า Dashboard ใน Grafana สำหรับ POSE Microservices

---

## 📥 Import Dashboard

### **Import Pre-built Dashboard**

**Step 1: Go to Import**
```
+ (Create) → Import → Upload JSON file
```

**Step 2: Select File**
- Navigate to: `backend/k8s/monitoring/`
- Select: `grafana-performance-dashboard.json`

**Step 3: Configure Import**
```
Dashboard name: POSE Microservices Performance
Folder: General
Prometheus: Select your Prometheus data source
```

**Step 4: Import**
- Click: **Import**

---

## 🎯 Metrics ที่แนะนำ (Essential Metrics)

Dashboard นี้เน้นเก็บเฉพาะ metrics ที่จำเป็นและมีประโยชน์จริงๆ สำหรับ production monitoring

---

## 🎨 Dashboard: Service Monitoring

### **Panel 1: Memory Usage (การใช้งาน RAM)**

**คำอธิบาย:**  
ดูว่าแต่ละ service ใช้ RAM เท่าไหร่ ช่วยเช็คว่ามี memory leak หรือไม่

**Query:**
```promql
sum by(pod) (container_memory_usage_bytes{namespace="pose-microservices"}) / (1024*1024)
```

**Visualization:** Time Series (กราฟเส้น)

**Settings:**
```yaml
Unit: megabytes (MB)
Legend: {{ pod }}
Y-axis min: 0
Thresholds:
  - 0-128MB: Green (ปกติ)
  - 128-256MB: Yellow (ค่อนข้างสูง)
  - 256-384MB: Orange (สูง)
  - 384-512MB: Red (วิกฤต)
```

**เมื่อไหร่ต้องระวัง:**
- ถ้ากราฟขึ้นเรื่อยๆ ไม่ลง = มี memory leak
- ถ้าใกล้ 512MB = ควรเพิ่ม memory หรือหา bug

---

### **Panel 2: CPU Usage (การใช้งาน CPU)**

**คำอธิบาย:**  
ดูว่าแต่ละ service ใช้ CPU เท่าไหร่ (เป็นเปอร์เซ็นต์)

**Query:**
```promql
rate(process_cpu_seconds_total{service=~".+"}[5m]) * 100
```

**Visualization:** Time Series (กราฟเส้น)

**Settings:**
```yaml
Unit: percent (%)
Legend: {{ service }} CPU
Y-axis min: 0
Y-axis max: 100
Thresholds:
  - 0-50%: Green (ปกติ)
  - 50-75%: Yellow (ปานกลาง)
  - 75-90%: Orange (สูง)
  - 90-100%: Red (เกือบเต็ม)
```

**เมื่อไหร่ต้องระวัง:**
- ถ้าสูงกว่า 80% นานๆ = ควร optimize code หรือเพิ่ม resources
- ถ้า 100% ตลอด = service ทำงานหนักเกินไป

---

### **Panel 3: Request Rate (จำนวน Request ต่อวินาที)**

**คำอธิบาย:**  
ดูว่าแต่ละ service มีคนเข้าใช้เท่าไหร่ มี traffic มากน้อยแค่ไหน

**Query:**
```promql
sum(rate(http_requests_total[5m])) by (service)
```

**Visualization:** Time Series (กราฟเส้น)

**Settings:**
```yaml
Unit: requests/sec (req/s)
Legend: {{ service }}
Y-axis min: 0
```

**ประโยชน์:**
- ดูช่วงเวลาที่มีคนใช้มากที่สุด (peak time)
- เช็คว่ามี traffic ผิดปกติหรือไม่
- วางแผน scaling

---

### **Panel 4: Response Time P95 (เวลาตอบกลับ)**

**คำอธิบาย:**  
ดูว่าระบบตอบกลับเร็วหรือช้า (95% ของ request ใช้เวลาเท่าไหร่)

**Query:**
```promql
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))
```

**Visualization:** Time Series (กราฟเส้น)

**Settings:**
```yaml
Unit: milliseconds (ms)
Legend: {{ service }} (P95)
Y-axis min: 0
Thresholds:
  - 0-200ms: Green (เร็วมาก)
  - 200-500ms: Yellow (ปกติ)
  - 500-1000ms: Orange (ช้า)
  - >1000ms: Red (ช้ามาก)
```

**เมื่อไหร่ต้องระวัง:**
- ถ้าช้ากว่า 500ms = user รู้สึกว่าช้า
- ถ้าช้ากว่า 1 วินาที = ต้อง optimize ด่วน

**P95 คืออะไร:**  
95% ของ request เสร็จภายในเวลานี้ (ช่วยกรอง outliers ที่ช้ามากๆ ออกไป)

---

### **Panel 5: Error Rate (อัตรา Error)**

**คำอธิบาย:**  
ดูว่ามี error เกิดขึ้นเท่าไหร่ (HTTP 5xx = server error)

**Query:**
```promql
sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
```

**Visualization:** Time Series (กราฟเส้น)

**Settings:**
```yaml
Unit: errors/sec
Legend: {{ service }} errors
Y-axis min: 0
Color: Red
Thresholds:
  - 0-1: Green (ปกติ)
  - 1-5: Yellow (ระวัง)
  - >5: Red (มีปัญหา)
```

**เมื่อไหร่ต้องระวัง:**
- ถ้ามี error แม้แค่นิดหน่อย = ต้องเช็คทันที
- ควรตั้ง alert เมื่อมี error > 1/sec

---

### **Panel 6: HTTP Status Codes (สถานะของ Request)**

**คำอธิบาย:**  
ดูว่า request มีสถานะอะไรบ้าง (200=สำเร็จ, 404=ไม่เจอ, 500=error)

**Query:**
```promql
sum(rate(http_requests_total[5m])) by (status)
```

**Visualization:** Pie Chart (กราฟวงกลม)

**Settings:**
```yaml
Legend: {{ status }}
Color mapping:
  - 2xx: Green (สำเร็จ)
  - 3xx: Blue (redirect)
  - 4xx: Orange (client error)
  - 5xx: Red (server error)
```

**ควรเป็นยังไง:**
- 2xx (200, 201) = สีเขียวควรเยอะที่สุด (80-95%)
- 4xx (404, 400) = น้อย (5-15%)
- 5xx (500, 502) = น้อยมากหรือไม่มีเลย (0%)

---

## 📊 Dashboard เพิ่มเติม (Optional)

### **Panel 7: Active Connections (Connection ที่เปิดอยู่)**

**คำอธิบาย:**  
ดูจำนวน connections, timers, handles ที่เปิดอยู่ (ช่วยตรวจจับ memory leak)

**Query:**
```promql
sum(nodejs_active_handles_total{service=~".+"}) by (service)
```

**Visualization:** Time Series (กราฟเส้น)

**Settings:**
```yaml
Unit: connections
Legend: {{ service }}
Y-axis min: 0
Thresholds:
  - 0-100: Green
  - 100-300: Yellow
  - 300-500: Orange
  - >500: Red
```

**เมื่อไหร่ต้องระวัง:**
- ถ้ากราฟขึ้นเรื่อยๆ = อาจมี connection leak
- ควรอยู่ในระดับคงที่

---

### **Panel 8: Database Query Duration (เวลา Query Database)**

**คำอธิบาย:**  
ดูว่า database query ใช้เวลานานเท่าไหร่

**Query:**
```promql
rate(prisma_client_queries_duration_histogram_ms_sum[5m]) / rate(prisma_client_queries_duration_histogram_ms_count[5m])
```

**Visualization:** Time Series (กราฟเส้น)

**Settings:**
```yaml
Unit: milliseconds (ms)
Y-axis min: 0
Thresholds:
  - 0-50ms: Green (เร็ว)
  - 50-100ms: Yellow (ปกติ)
  - 100-200ms: Orange (ช้า)
  - >200ms: Red (ช้าเกินไป)
```

**เมื่อไหร่ต้องระวัง:**
- ถ้าช้ากว่า 100ms = ควร optimize query หรือเพิ่ม index

---

## 🔔 Alerts (การแจ้งเตือน)

### **Alert 1: Service Down (Service ล่ม)**

```yaml
Alert name: Service Down
Evaluate every: 1m
For: 1m

Query:
up{job="pose-services"} == 0

Condition: BELOW 1
```

**ความหมาย:** Service หยุดทำงาน ต้องเช็คทันที!

---

### **Alert 2: High Memory Usage (RAM ใกล้เต็ม)**

```yaml
Alert name: High Memory Usage
Evaluate every: 1m
For: 5m

Query:
(sum by(pod) (container_memory_usage_bytes{namespace="pose-microservices"}) / (1024*1024)) > 400

Condition: ABOVE 400MB for 5 minutes
```

**ความหมาย:** ใช้ RAM มากกว่า 400MB นาน 5 นาที (ใกล้ limit 512MB แล้ว)

---

### **Alert 3: High CPU Usage (CPU สูงเกินไป)**

```yaml
Alert name: High CPU Usage
Evaluate every: 1m
For: 5m

Query:
rate(process_cpu_seconds_total[5m]) * 100 > 80

Condition: ABOVE 80% for 5 minutes
```

**ความหมาย:** ใช้ CPU มากกว่า 80% นาน 5 นาที

---

### **Alert 4: High Error Rate (มี Error เยอะ)**

```yaml
Alert name: High Error Rate
Evaluate every: 1m
For: 5m

Query:
sum(rate(http_requests_total{status=~"5.."}[5m])) > 1

Condition: ABOVE 1 error/sec for 5 minutes
```

**ความหมาย:** มี error เกิดขึ้นมากกว่า 1 ครั้ง/วินาที นาน 5 นาที

---

### **Alert 5: Slow Response Time (ตอบกลับช้า)**

```yaml
Alert name: Slow Response Time
Evaluate every: 1m
For: 3m

Query:
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 1

Condition: ABOVE 1 second for 3 minutes
```

**ความหมาย:** Response time P95 ช้ากว่า 1 วินาที นาน 3 นาที

---

## 🔧 Variables (ตัวแปรสำหรับกรอง)

### **Service Name Variable**

ใช้สำหรับเลือกดู service ที่ต้องการ

**Dashboard Settings → Variables → Add variable**

```yaml
Name: service
Type: Query
Query: label_values(http_requests_total, service)
Multi-value: Yes
Include All option: Yes
```

**วิธีใช้ใน Query:**
```promql
rate(http_requests_total{service=~"$service"}[5m])
```

แล้วจะมี dropdown ให้เลือก service ที่ต้องการดู!

---

## 🐛 Troubleshooting (แก้ปัญหา)

### **ปัญหา: ไม่มีข้อมูลใน Dashboard**

**วิธีแก้:**

**1. เช็คว่า Prometheus เก็บ metrics ได้หรือไม่**
```bash
# ดู targets ของ Prometheus
kubectl port-forward -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090

# เปิดใน browser: http://localhost:9090/targets
# ต้องเห็น pose-services เป็นสีเขียว (UP)
```

**2. เช็คว่า service ส่ง metrics หรือไม่**
```bash
# Port-forward ไป service
kubectl port-forward -n pose-microservices svc/gateway-api 3000:3000

# เช็ค metrics endpoint
curl http://localhost:3000/metrics

# ต้องเห็น metrics เช่น http_requests_total, process_resident_memory_bytes
```

**3. เช็ค ServiceMonitor**
```bash
# ดู ServiceMonitor
kubectl get servicemonitor -n monitoring

# ดูรายละเอียด
kubectl describe servicemonitor pose-services -n monitoring
```

---

### **ปัญหา: Prometheus ไม่ทำงาน**

```bash
# เช็ค Prometheus pods
kubectl get pods -n monitoring | grep prometheus

# ดู logs
kubectl logs -n monitoring prometheus-kube-prometheus-prometheus-0

# เช็ค service
kubectl get svc -n monitoring prometheus-kube-prometheus-prometheus
```

---

### **ปัญหา: Query ไม่ทำงาน**

**วิธีแก้:**

1. ไปที่ **Explore** ใน Grafana (ไอคอนเข็มทิศ)
2. เลือก **Prometheus** data source
3. ลอง query ง่ายๆ ก่อน:
```promql
up{job="pose-services"}
```
4. ถ้าไม่มีข้อมูล = Prometheus ไม่เห็น service
5. ถ้ามีข้อมูล = เช็คว่า label ถูกต้องหรือไม่

---

## 📝 Metrics Quick Reference (ตารางอ้างอิง)

| Metric | คำอธิบาย | หน่วย | Query |
|--------|----------|-------|-------|
| **Memory** | ใช้ RAM เท่าไหร่ | MB | `container_memory_usage_bytes / (1024*1024)` |
| **CPU** | ใช้ CPU กี่ % | % | `rate(process_cpu_seconds_total[5m]) * 100` |
| **Request Rate** | มี request เท่าไหร่/วินาที | req/s | `sum(rate(http_requests_total[5m])) by (service)` |
| **Response Time** | ตอบกลับใช้เวลานานเท่าไหร่ | ms | `histogram_quantile(0.95, ...)` |
| **Error Rate** | มี error เท่าไหร่/วินาที | error/s | `sum(rate(http_requests_total{status=~"5.."}[5m]))` |
| **Active Connections** | มี connection เปิดอยู่เท่าไหร่ | count | `nodejs_active_handles_total` |
| **DB Query Time** | query database ใช้เวลาเท่าไหร่ | ms | `rate(prisma_...sum) / rate(prisma_...count)` |

---

## 💡 Tips & Best Practices

### **1. ตั้งค่า Dashboard**
- ✅ ใช้ time range 1 hour หรือ 24 hours สำหรับ overview
- ✅ ตั้ง auto-refresh ทุก 30 วินาทีหรือ 1 นาที
- ✅ จัดกลุ่ม panels ที่เกี่ยวข้องกัน (เช่น Memory + CPU ไว้ด้วยกัน)
- ✅ ใช้สีที่สื่อความหมาย (เขียว=ดี, แดง=แย่)

### **2. การดู Metrics**
- ✅ เช็ค Memory และ CPU ก่อนเสมอ (พื้นฐานสุด)
- ✅ ดู Response Time เป็นประจำ (ผลกระทบต่อ user)
- ✅ ตั้ง alert สำหรับ Error Rate (ต้องรู้ทันทีถ้ามี error)
- ✅ เปรียบเทียบ metrics ระหว่าง services เพื่อหา bottleneck

### **3. การแก้ปัญหา**
- Memory สูง → เช็ค memory leak, optimize code, เพิ่ม RAM
- CPU สูง → optimize algorithm, ใช้ cache, scale horizontal
- Response Time ช้า → optimize database query, เพิ่ม cache, ย้าย logic ออกจาก main thread
- Error Rate สูง → เช็ค logs, fix bugs, เพิ่ม error handling

### **4. การ Export Dashboard**
```bash
# Export (backup)
Dashboard → Share → Export → Save to file

# Import (restore)
+ (Create) → Import → Upload JSON file
```

---

## 📊 สรุป: Metrics ที่ต้องมี

### **🔴 Priority 1 - ต้องมี (Must Have)**
1. **Memory Usage** - ใช้ RAM เท่าไหร่
2. **CPU Usage** - ใช้ CPU เท่าไหร่
3. **Request Rate** - มี traffic เท่าไหร่
4. **Response Time** - เร็วหรือช้า
5. **Error Rate** - มี error หรือไม่
6. **HTTP Status Codes** - สถานะของ requests

### **🟡 Priority 2 - ควรมี (Nice to Have)**
7. **Active Connections** - ช่วยตรวจจับ connection leak
8. **Database Query Duration** - ช่วยหาจุดช้าใน database

### **⚪ Priority 3 - ไม่จำเป็น (Advanced)**
- Event Loop Lag - สำหรับ debug performance ลึกๆ
- Garbage Collection Time - สำหรับ debug memory issues
- Heap Usage - ละเอียดกว่า Memory Usage

---

## 📞 ติดต่อ & Support

หากมีปัญหา:
1. เช็ค Prometheus targets: `http://PROMETHEUS_URL:9090/targets`
2. เช็ค metrics endpoint: `curl http://SERVICE:PORT/metrics`
3. เช็ค Grafana logs: `kubectl logs -n monitoring deployment/grafana`
4. เช็ค ServiceMonitor: `kubectl describe servicemonitor pose-services -n monitoring`

---

**Last Updated:** 2025-01-17  
**Grafana Version:** 10.x  
**Prometheus Version:** 2.x
