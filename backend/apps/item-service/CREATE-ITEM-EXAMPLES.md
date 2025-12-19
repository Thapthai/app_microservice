# Create Item - Postman Examples

## Endpoints

### Option 1: Via Gateway API (Recommended)
```
POST http://localhost:3000/api/v1/items
Content-Type: application/json
```

### Option 2: Direct to Item Service
```
POST http://localhost:3009/items
Content-Type: application/json
```

## Example 1: Absolute Minimal (Required Only)
```json
{
  "itemcode": "TEST001"
}
```

## Example 2: Recommended Basic Fields (4 fields)
```json
{
  "itemcode": "MED2024001",
  "itemname": "ชุดเครื่องมือผ่าตัดใหญ่",
  "Alternatename": "Major Surgical Instrument Set",
  "Barcode": "8859876543210"
}
```

## Example 3: Basic Item with Common Fields
```json
{
  "itemcode": "S4214NACISP10",
  "itemname": "ชุดผ่าตัดแบบใช้ครั้งเดียว",
  "Alternatename": "Surgical Set Single Use",
  "Barcode": "8851234567890",
  "IsSet": "1",
  "IsReuse": "0",
  "IsNormal": "1",
  "itemtypeID": 1,
  "UnitID": 1,
  "DepartmentID": 5,
  "CostPrice": 1500.50,
  "SalePrice": 2000.00,
  "UsagePrice": 1800.00,
  "stock_balance": 100,
  "stock_min": 10,
  "stock_max": 500,
  "item_status": 0
}
```

## Example 4: Complete Item with All Important Fields
```json
{
  "itemcode": "MED2024001",
  "itemname": "ชุดเครื่องมือผ่าตัดใหญ่",
  "Alternatename": "Major Surgical Instrument Set",
  "Barcode": "8859876543210",
  "IsSet": "1",
  "IsReuse": "1",
  "IsNormal": "1",
  "itemtypeID": 2,
  "UnitID": 1,
  "SpecialID": 0,
  "DepartmentID": 3,
  "ShelfLifeID": 0,
  "SetCount": 25,
  "PackingMatID": 0,
  "CostPrice": 25000.00,
  "SalePrice": 35000.00,
  "UsagePrice": 30000.00,
  "SterileMachineID": 1,
  "SterileProcessID": 2,
  "WashMachineID": 1,
  "WashProcessID": 1,
  "SupllierID": 0,
  "FactID": 0,
  "LabelID": 0,
  "Minimum": 5,
  "Maximum": 50,
  "weight": 2.5,
  "IsSpecial": "0",
  "LabelGroupID": 1,
  "Picture": "/uploads/items/med2024001.jpg",
  "Picture2": "/uploads/items/med2024001_2.jpg",
  "NoWash": false,
  "IsWashDept": 1,
  "PriceID": 0,
  "itemcode2": "MED-ALT-001",
  "IsNonUsage": false,
  "itemcode3": "MED-SEC-001",
  "IsPrintDepartment": true,
  "IsStock": true,
  "IsRecieveRecordOnly": false,
  "IsWasting": false,
  "IsCheckList": false,
  "RoundOfTimeUsed": 3,
  "NoWashType": 0,
  "IsCSSDComfirm": 1,
  "IsDenger": 0,
  "IsInternalIndicatorCheck": 1,
  "IsFillterCheck": 0,
  "IsLabelingCheck": 1,
  "IsLoaner": 0,
  "LimitUse": 100,
  "PayDep": 0,
  "IsRemarkRound": 0,
  "IsReceiveNotSterile": true,
  "IsReceiveManual": false,
  "RefNo": "REF-2024-001",
  "IsCancel": 0,
  "IsSingle": false,
  "IsNotShowSendSterile": false,
  "Store": "Main Storage",
  "PackingMat": "Sterile Bag",
  "ShelfLife": 365,
  "ManufacturerName": "Medical Supplies Co., Ltd.",
  "item_data_1_id": 1,
  "InternalCode": "INT-2024-001",
  "ManufacturerMemo": "High quality surgical instruments",
  "item_data_1": 100,
  "Picweb": "https://example.com/images/med2024001.jpg",
  "SuplierName": "Global Medical Supplies",
  "IsNoSterile": false,
  "IsShowQrItemCode": true,
  "SuplierNameMemo": "Main supplier for surgical equipment",
  "IsSingleUsage": false,
  "ListUnderLineNo": "Line-001",
  "Isopdipd": 1,
  "Note": "ชุดเครื่องมือผ่าตัดคุณภาพสูง ต้องผ่านการฆ่าเชื้อทุกครั้งก่อนใช้งาน",
  "B_ID": 123,
  "ListColorLineNo": "Blue",
  "IsPrintNoSterile": false,
  "IsPayToSend": 1,
  "IsTrackAuto": false,
  "IsGroupPrintSticker": true,
  "FileUpload": "/uploads/docs/med2024001_manual.pdf",
  "IsUsageName": true,
  "Typeitemcode": 1,
  "Picture3": "/uploads/items/med2024001_3.jpg",
  "Picture4": "/uploads/items/med2024001_4.jpg",
  "Picture5": "/uploads/items/med2024001_5.jpg",
  "IsFabric": false,
  "WashPriceId": 100,
  "SterilePriceId": 200,
  "ReProcessPrice": 300.00,
  "wash_price_id": 100,
  "sterile_price_id": 200,
  "reprocess_price": 300.00,
  "UserCreate": 1,
  "UserModify": 1,
  "IsNumber": false,
  "SapCode": "SAP-2024-001",
  "IsChangeUsageInSet": false,
  "IsNH": 0,
  "MaxInventory": 1000,
  "procedureID": 5,
  "Description": "Complete surgical instrument set for major operations",
  "ReuseDetect": "RFID-ENABLED",
  "stock_max": 500,
  "stock_min": 10,
  "stock_balance": 100,
  "warehouseID": 1,
  "fixcost": false,
  "main_max": 1000,
  "main_min": 50,
  "item_status": 0
}
```

## Example 4: Simple Reusable Item
```json
{
  "itemcode": "REUSE001",
  "itemname": "กรรไกรผ่าตัดแบบใช้ซ้ำ",
  "Alternatename": "Reusable Surgical Scissors",
  "Barcode": "8851111222333",
  "IsSet": "0",
  "IsReuse": "1",
  "IsNormal": "1",
  "CostPrice": 5000.00,
  "SalePrice": 7000.00,
  "stock_balance": 50,
  "stock_min": 5,
  "stock_max": 100,
  "item_status": 0
}
```

## Example 5: Single-Use Disposable Item
```json
{
  "itemcode": "DISP001",
  "itemname": "ถุงมือผ่าตัดแบบใช้ครั้งเดียว",
  "Alternatename": "Disposable Surgical Gloves",
  "Barcode": "8854444555666",
  "IsSet": "0",
  "IsReuse": "0",
  "IsNormal": "1",
  "IsSingleUsage": true,
  "CostPrice": 50.00,
  "SalePrice": 100.00,
  "stock_balance": 1000,
  "stock_min": 100,
  "stock_max": 5000,
  "item_status": 0
}
```

## Example 7: Item Set with Multiple Components
```json
{
  "itemcode": "SET2024001",
  "itemname": "ชุดผ่าตัดทั่วไป (25 ชิ้น)",
  "Alternatename": "General Surgical Set (25 pieces)",
  "Barcode": "8857777888999",
  "IsSet": "1",
  "IsReuse": "1",
  "IsNormal": "1",
  "SetCount": 25,
  "itemtypeID": 1,
  "UnitID": 1,
  "DepartmentID": 3,
  "CostPrice": 15000.00,
  "SalePrice": 22000.00,
  "UsagePrice": 18000.00,
  "SterileMachineID": 1,
  "SterileProcessID": 1,
  "WashMachineID": 1,
  "WashProcessID": 1,
  "stock_balance": 20,
  "stock_min": 3,
  "stock_max": 50,
  "item_status": 0
}
```

## Field Descriptions

### Required Fields:
- **itemcode** (String, Required): รหัสสินค้า (Primary Key)

### Common Optional Fields:
- **itemname**: ชื่อสินค้า
- **Barcode**: บาร์โค้ด
- **IsSet**: "1" = ชุด, "0" = ชิ้นเดียว
- **IsReuse**: "1" = ใช้ซ้ำได้, "0" = ใช้ครั้งเดียว
- **IsNormal**: "1" = ปกติ, "0" = ไม่ปกติ
- **CostPrice**: ราคาทุน (Decimal)
- **SalePrice**: ราคาขาย (Decimal)
- **UsagePrice**: ราคาใช้งาน (Decimal)
- **stock_balance**: จำนวนคงเหลือ
- **stock_min**: จำนวนต่ำสุด
- **stock_max**: จำนวนสูงสุด
- **item_status**: 0 = active, อื่นๆ = inactive

### Important Notes:
1. **itemcode** เป็น field เดียวที่ required (จำเป็นต้องมี)
2. Fields ที่เป็น Boolean สามารถใช้ `true/false` ได้
3. Fields ที่เป็น IsSet, IsReuse, IsNormal ใช้ `"0"` หรือ `"1"` (String)
4. Decimal fields (CostPrice, SalePrice, etc.) ใช้ตัวเลขทศนิยม
5. ถ้าไม่ส่ง field ใดๆ มา จะเป็น `null` หรือใช้ default value ที่กำหนดใน schema
6. **ห้ามส่ง `undefined` หรือ `null` เป็น value** - ถ้าไม่ต้องการ field ใด ให้ไม่ต้องส่งมาเลย
7. System จะ filter `undefined` และ `null` values ออกอัตโนมัติก่อน create

## Testing in Postman

### Step 1: Set Headers
```
Content-Type: application/json
```

### Step 2: Set Method and URL
```
POST http://localhost:3002/items
```

### Step 3: Set Body (raw JSON)
เลือกตัวอย่าง JSON ข้างบนที่ต้องการทดสอบ

**Important:** ส่งเป็น **raw JSON** เท่านั้น ไม่ใช่ form-data

### Expected Response (Success):
```json
{
  "success": true,
  "message": "Item created successfully",
  "data": {
    "itemcode": "TEST001",
    "itemname": "...",
    ...
  }
}
```

### Expected Response (Error - Duplicate):
```json
{
  "success": false,
  "message": "Failed to create item",
  "error": "Unique constraint failed on the fields: (`itemcode`)"
}
```
