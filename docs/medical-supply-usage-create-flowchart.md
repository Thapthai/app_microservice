# Flowchart: Medical Supply Usage Create Function

## Overview
ฟังก์ชัน `create` ใช้สำหรับสร้างหรืออัปเดต Medical Supply Usage records โดยรองรับทั้งรูปแบบใหม่ (Order format) และรูปแบบเก่า (Legacy supplies format)

---

## Main Flow

```mermaid
flowchart TD
    Start([เริ่มต้น: create function]) --> ExtractData[ดึงข้อมูล Patient<br/>HN, EN, FirstName, Lastname, Hospital]
    
    ExtractData --> ProcessUser[ประมวลผล User Context<br/>- ตรวจสอบ userType<br/>- สร้าง recorded_by_user_id<br/>- รองรับ admin/staff/unknown]
    
    ProcessUser --> ExtractItems[แยก Order Items และ Legacy Supplies]
    
    ExtractItems --> CheckExisting{มี Existing Usage?<br/>EN + HN + FirstName + Lastname}
    
    CheckExisting -->|มี| ProcessExisting[ประมวลผล Existing Usage]
    CheckExisting -->|ไม่มี| ProcessDiscontinue[ประมวลผล Discontinue Items]
    
    ProcessExisting --> ReturnExisting([Return Updated Usage])
    
    ProcessDiscontinue --> ValidateItems{มี Items ที่ต้องสร้าง?}
    
    ValidateItems -->|ไม่มี| ReturnDiscontinue([Return Updated Usage<br/>จาก Discontinue])
    ValidateItems -->|มี| ValidateCodes[ตรวจสอบ ItemCodes]
    
    ValidateCodes -->|Invalid| ErrorLog[สร้าง Error Log<br/>Throw BadRequestException]
    ValidateCodes -->|Valid| CreateNew[สร้าง Usage ใหม่พร้อม Supply Items]
    
    CreateNew --> SuccessLog[สร้าง Success Log]
    SuccessLog --> ReturnNew([Return New Usage])
    
    ErrorLog --> End([จบ: Throw Error])
    ReturnExisting --> End
    ReturnDiscontinue --> End
    ReturnNew --> End
    
    style Start fill:#e1f5ff
    style End fill:#ffe1e1
    style ReturnExisting fill:#d4edda
    style ReturnNew fill:#d4edda
    style ReturnDiscontinue fill:#d4edda
    style ErrorLog fill:#f8d7da
```

---

## Process Existing Usage (Detailed)

```mermaid
flowchart TD
    Start[เริ่ม: Process Existing Usage] --> LoopItems[วนลูป Order Items]
    
    LoopItems --> CheckDiscontinue{Item Status =<br/>Discontinue?}
    
    CheckDiscontinue -->|ใช่| FindDiscontinueItem[ค้นหา Existing Item<br/>ด้วย AssessionNo]
    
    FindDiscontinueItem --> HasDiscontinueItem{พบ Item?}
    
    HasDiscontinueItem -->|ใช่| UpdateDiscontinue[อัปเดต Item:<br/>- order_item_status = 'Discontinue'<br/>- qty_used_with_patient = 0]
    
    UpdateDiscontinue --> LogDiscontinue[สร้าง Log: discontinue_item]
    LogDiscontinue --> ContinueLoop[Continue Loop]
    
    HasDiscontinueItem -->|ไม่| ContinueLoop
    
    CheckDiscontinue -->|ไม่ใช่| FindExistingItem[ค้นหา Existing Item<br/>ด้วย AssessionNo]
    
    FindExistingItem --> HasExistingItem{พบ Item?}
    
    HasExistingItem -->|ใช่| AddToUpdate[เพิ่มเข้า itemsToUpdate<br/>เพื่ออัปเดต Status]
    HasExistingItem -->|ไม่| AddToCreate[เพิ่มเข้า itemsToCreate<br/>เพื่อสร้างใหม่]
    
    AddToUpdate --> ContinueLoop
    AddToCreate --> ContinueLoop
    
    ContinueLoop --> MoreItems{มี Items<br/>เหลืออีก?}
    MoreItems -->|ใช่| LoopItems
    MoreItems -->|ไม่| UpdateItems[อัปเดต Items ที่มี AssessionNo ตรง]
    
    UpdateItems --> LogUpdates[สร้าง Log: update_item_status]
    LogUpdates --> CheckNewItems{มี Items<br/>ใหม่?}
    
    CheckNewItems -->|ใช่| ValidateNewCodes[ตรวจสอบ ItemCodes<br/>ของ Items ใหม่]
    
    ValidateNewCodes -->|Invalid| ThrowError[Throw BadRequestException]
    ValidateNewCodes -->|Valid| CreateNewItems[สร้าง Supply Items ใหม่]
    
    CreateNewItems --> LogNewItems[สร้าง Log: add_new_items]
    LogNewItems --> UpdateBilling[อัปเดต Billing Metadata<br/>ถ้ามี]
    
    CheckNewItems -->|ไม่| UpdateBilling
    
    UpdateBilling --> FetchUpdated[ดึง Updated Usage<br/>พร้อม Supply Items]
    FetchUpdated --> Return([Return Updated Usage])
    
    ThrowError --> End([จบ: Error])
    Return --> End
    
    style Start fill:#e1f5ff
    style Return fill:#d4edda
    style ThrowError fill:#f8d7da
    style End fill:#ffe1e1
```

---

## Process Discontinue Items (When No Existing Usage)

```mermaid
flowchart TD
    Start[เริ่ม: Process Discontinue Items] --> FilterDiscontinue[กรอง Discontinue Items<br/>จาก Order Items]
    
    FilterDiscontinue --> HasDiscontinue{มี Discontinue<br/>Items?}
    
    HasDiscontinue -->|ไม่มี| SkipDiscontinue[ข้าม Discontinue Processing]
    HasDiscontinue -->|มี| CheckEpisode{มี Episode Number?}
    
    CheckEpisode -->|ไม่มี| SkipDiscontinue
    CheckEpisode -->|มี| FindEpisodeUsages[ค้นหา All Usages<br/>ใน Episode เดียวกัน<br/>EN + HN]
    
    FindEpisodeUsages --> HasUsages{พบ Usages?}
    
    HasUsages -->|ไม่| ThrowError[Throw BadRequestException<br/>'No existing usage found']
    HasUsages -->|ใช่| LoopDiscontinueItems[วนลูป Discontinue Items]
    
    LoopDiscontinueItems --> LoopUsages[วนลูป Episode Usages]
    
    LoopUsages --> FindMatchingItems[ค้นหา Items ที่มี<br/>AssessionNo ตรงกัน<br/>และ Status != 'discontinue']
    
    FindMatchingItems --> HasMatching{พบ Matching<br/>Items?}
    
    HasMatching -->|ใช่| UpdateToDiscontinue[อัปเดต Item:<br/>- order_item_status = 'Discontinue'<br/>- qty_used_with_patient = 0]
    
    UpdateToDiscontinue --> LogCancellation[สร้าง Log: discontinue_item<br/>reason: 'Bill cancelled']
    
    LogCancellation --> AddUsageId[เพิ่ม Usage ID<br/>เข้า updatedUsageIds]
    
    HasMatching -->|ไม่| CheckMoreUsages{มี Usages<br/>เหลืออีก?}
    AddUsageId --> CheckMoreUsages
    
    CheckMoreUsages -->|ใช่| LoopUsages
    CheckMoreUsages -->|ไม่| CheckMoreDiscontinue{มี Discontinue<br/>Items เหลืออีก?}
    
    CheckMoreDiscontinue -->|ใช่| LoopDiscontinueItems
    CheckMoreDiscontinue -->|ไม่| UpdateBillingStatus[อัปเดต Billing Status<br/>ของ Affected Usages<br/>เป็น 'CANCELLED']
    
    UpdateBillingStatus --> LogBillingUpdate[สร้าง Log:<br/>update_billing_status_for_discontinue]
    
    LogBillingUpdate --> SkipDiscontinue
    ThrowError --> End([จบ: Error])
    SkipDiscontinue --> End
    
    style Start fill:#e1f5ff
    style ThrowError fill:#f8d7da
    style End fill:#ffe1e1
```

---

## Create New Usage (Detailed)

```mermaid
flowchart TD
    Start[เริ่ม: Create New Usage] --> FilterNonDiscontinue[กรอง Order Items<br/>ที่ไม่ใช่ Discontinue]
    
    FilterNonDiscontinue --> CombineItemCodes[รวม ItemCodes<br/>จาก Order Items + Legacy Supplies]
    
    CombineItemCodes --> HasItemCodes{มี ItemCodes?}
    
    HasItemCodes -->|ไม่มี| SkipValidation[ข้าม Validation]
    HasItemCodes -->|มี| ValidateCodes[ตรวจสอบ ItemCodes<br/>validateItemCodes]
    
    ValidateCodes --> HasInvalid{มี Invalid<br/>Codes?}
    
    HasInvalid -->|ใช่| LogError[สร้าง Error Log<br/>Invalid ItemCodes]
    LogError --> ThrowError[Throw BadRequestException<br/>with invalidCodes]
    
    HasInvalid -->|ไม่| SkipValidation
    SkipValidation --> CheckEmpty{มี Items<br/>ที่ต้องสร้าง?}
    
    CheckEmpty -->|ไม่มี| FindUpdatedUsage[ค้นหา Updated Usage<br/>จาก Discontinue Processing]
    
    FindUpdatedUsage --> HasUpdated{พบ Updated<br/>Usage?}
    
    HasUpdated -->|ใช่| LogDiscontinueOnly[สร้าง Log:<br/>discontinue_items_only]
    LogDiscontinueOnly --> ReturnUpdated([Return Updated Usage])
    
    HasUpdated -->|ไม่| ThrowNoUsage[Throw BadRequestException<br/>'No usage found to update']
    
    CheckEmpty -->|มี| CreateUsage[สร้าง MedicalSupplyUsage<br/>พร้อม Supply Items]
    
    CreateUsage --> MapOrderItems[Map Order Items<br/>เป็น Supply Items<br/>New Format]
    
    MapOrderItems --> MapLegacySupplies[Map Legacy Supplies<br/>เป็น Supply Items<br/>Legacy Format]
    
    MapLegacySupplies --> CreateSuccessLog[สร้าง Success Log<br/>- order_items_count<br/>- discontinue_items_count<br/>- supplies_count<br/>- total_amount]
    
    CreateSuccessLog --> ReturnNew([Return New Usage])
    
    ThrowError --> End([จบ: Error])
    ThrowNoUsage --> End
    ReturnUpdated --> End
    ReturnNew --> End
    
    style Start fill:#e1f5ff
    style ReturnUpdated fill:#d4edda
    style ReturnNew fill:#d4edda
    style ThrowError fill:#f8d7da
    style ThrowNoUsage fill:#f8d7da
    style End fill:#ffe1e1
```

---

## Key Decision Points

### 1. Existing Usage Check
- **เงื่อนไข**: EN + HN + FirstName + Lastname ตรงกัน
- **ผลลัพธ์**: 
  - มี → Process Existing Usage
  - ไม่มี → Process Discontinue Items → Create New Usage

### 2. Discontinue Item Processing
- **เมื่อมี Existing Usage**: ประมวลผลใน Process Existing Usage loop
- **เมื่อไม่มี Existing Usage**: ประมวลผลแยกก่อนสร้าง Usage ใหม่

### 3. Item Matching Logic
- **ใช้ AssessionNo** เป็น key ในการ match
- **ถ้า AssessionNo ตรง**: อัปเดต Status
- **ถ้า AssessionNo ไม่ตรง**: สร้าง Item ใหม่

### 4. Validation
- **ตรวจสอบ ItemCodes** ก่อนสร้าง Items ใหม่
- **ไม่ตรวจสอบ** สำหรับ Discontinue Items (เพราะใช้แค่ยกเลิก Items เดิม)

---

## Error Handling

```mermaid
flowchart TD
    Error[เกิด Error] --> CatchBlock[เข้าสู่ Catch Block]
    
    CatchBlock --> CreateErrorLog[สร้าง Error Log<br/>- type: 'CREATE'<br/>- status: 'ERROR'<br/>- error_message<br/>- error_code<br/>- input_data]
    
    CreateErrorLog --> ThrowError[Throw Error<br/>ให้ Caller จัดการ]
    
    ThrowError --> End([จบ])
    
    style Error fill:#f8d7da
    style End fill:#ffe1e1
```

---

## Summary

ฟังก์ชันนี้มี 3 เส้นทางหลัก:

1. **Existing Usage Path**: อัปเดต Usage ที่มีอยู่แล้ว
   - ประมวลผล Discontinue Items
   - อัปเดต Items ที่มี AssessionNo ตรง
   - สร้าง Items ใหม่ที่ไม่มี AssessionNo ตรง

2. **Discontinue Only Path**: มีแค่ Discontinue Items (ไม่มี Existing Usage)
   - ค้นหา Usages ใน Episode เดียวกัน
   - อัปเดต Items ที่มี AssessionNo ตรงเป็น Discontinue
   - Return Updated Usage

3. **New Usage Path**: สร้าง Usage ใหม่
   - ตรวจสอบ ItemCodes
   - สร้าง Usage พร้อม Supply Items
   - Return New Usage
