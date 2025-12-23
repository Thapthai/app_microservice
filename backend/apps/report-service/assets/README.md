# Thai Fonts for PDF Generation

## วิธีเพิ่มฟอนต์ภาษาไทย

1. ดาวน์โหลดฟอนต์ THSarabunNew จาก:
   - https://github.com/google/fonts/tree/main/ofl/sarabun
   - หรือ https://fonts.google.com/specimen/Sarabun

2. วางไฟล์ฟอนต์ในโฟลเดอร์นี้:
   - `THSarabunNew-Regular.ttf` (หรือ `THSarabunNew.ttf`)
   - `THSarabunNew-Bold.ttf`

3. Restart report-service

## ไฟล์ที่ต้องการ

- `THSarabunNew-Regular.ttf` หรือ `THSarabunNew.ttf` - สำหรับข้อความปกติ
- `THSarabunNew-Bold.ttf` - สำหรับข้อความหนา

## หมายเหตุ

- ถ้าไม่มีฟอนต์ภาษาไทย PDF จะใช้ Helvetica ซึ่งไม่รองรับภาษาไทย
- ภาษาไทยจะแสดงเป็นสี่เหลี่ยมหรือตัวอักษรแปลกๆ ถ้าไม่มีฟอนต์ที่ถูกต้อง

