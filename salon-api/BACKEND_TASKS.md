# BACKEND_TASKS.md — แผนงาน Backend (ข้อมูลหลังบ้านเจ้าของร้าน)

## ภาพรวม
- เพิ่มระบบยืนยันตัวเจ้าของร้านด้วย **PIN เบอร์เดียว** (ไม่มี username/password, ไม่มี role)
- แยก endpoint ข้อมูลจอง: ส่วนที่ลูกค้าใช้ยังเปิดได้ ส่วนรายละเอียด (ชื่อ/เบอร์) ต้องมี token เจ้าของร้าน
- เพิ่มความสามารถค้นหา/กรองรายการจอง + เปลี่ยนสถานะการจอง

## 1. Config (appsettings)
เพิ่มใน `appsettings.json` (หรือ `appsettings.Development.json` สำหรับ dev):
```json
"OwnerAuth": {
  "Pin": "2499",
  "TokenTtlHours": 12
}
```
- `Pin` = รหัสเจ้าของร้าน (ค่า dev ตัวอย่าง เปลี่ยนก่อน production)
- `TokenTtlHours` = อายุ session token

## 2. Auth — ระบบ PIN / Token
### ใหม่: `Services/OwnerAuthService.cs`
- ตรวจ PIN แบบ **constant-time compare**
- สร้าง token: `Guid.NewGuid().ToString("N")` เก็บใน `ConcurrentDictionary<string, DateTime>` (หมดอายุตาม `TokenTtlHours`)
- `bool VerifyPin(string pin)`, `string IssueToken()`, `bool IsValid(string token)` (แล้วลบที่หมดอายุ)

### ใหม่: `Services/OwnerAuthorizeFilter.cs`
- `IActionFilter` ตรวจ `Authorization: Bearer <token>` เรียก `OwnerAuthService.IsValid`
- ไม่มี/ผิด/หมดอายุ → ตอบ **401**
- ติดได้ด้วย `[ServiceFilter(typeof(OwnerAuthorizeFilter))]`

### ใหม่: `Controllers/AuthController.cs`
```
POST /api/v1/auth/owner        (เปิดสาธารณะ)
```
Request:
```json
{ "pin": "2499" }
```
Response:
- **200** `{ "token": "…", "expiresAt": "2026-09-07T19:00:00Z" }`
- **401** `{ "message": "PIN ผิด" }`

## 3. BookingsController — ปรับ/เพิ่ม
### 3.1 ใหม่ (เปิดสาธารณะ ลูกค้าใช้) — ดูแค่ช่วงที่ถูกจอง ไม่มี PII
```
GET /api/v1/bookings/availability?date=2026-09-08
```
Response **200**:
```json
{ "date": "2026-09-08", "taken": [ { "startTime": "08:00:00", "endTime": "08:45:00" } ] }
```
เฉพาะ booking ที่ `status != Cancelled`

### 3.2 แก้ `GET /api/v1/bookings` → ให้ `[OwnerAuthorizeFilter]` (มี token เท่านั้น)
- เพิ่ม query param `search` (เช็ค `Customer.Name` / `Customer.PhoneNumber` / `Service.NameTh` / `Service.NameEn` แบบ Contains)
- คง `date` และ `status` เดิม
- Response เหมือนเดิม (มี PII ได้เฉพาะเจ้าของร้าน)

### 3.3 ใหม่ (Owner เท่านั้น) — เปลี่ยนสถานะการจอง
```
PATCH /api/v1/bookings/{id}/status
```
Request:
```json
{ "status": "Confirmed" }
```
`status` ใช้ได้: `Confirmed | Completed | Cancelled`
Response:
- **200** — object BookingResponse ที่อัปเดตแล้ว
- **400** — สถานะไม่ถูกต้อง / `Pending` ใช้ตั้งไม่ได้
- **404** — ไม่พบ booking

## 4. Program.cs
- ลงทะเบียน `OwnerAuthService` (singleton)
- ลงทะเบียน `OwnerAuthorizeFilter`

## 5. บันทึกความปลอดภัย
- `GET /api/v1/bookings` (รายละเอียด PII) และ `PATCH …/status` → ต้องมี token
- ยังเปิดสาธารณะตามปกติ: `GET /api/v1/bookings/availability`, `POST /api/v1/bookings`, `GET/POST /api/v1/customers`, `GET /api/v1/services`
- Frontend หน้า **booking (ลูกค้า)** จะเปลี่ยนไปเรียก `/availability` → ไม่ได้เห็นชื่อ/เบอร์ของคนอื่น
- ไม่ต้องติดตั้ง package JWT เพิ่ม (ใช้ in-memory token แค่เจ้าของคนเดียว)

## 6. รายการงาน ( checklist )
- [ ] เพิ่ม `OwnerAuth` ใน config
- [ ] `Services/OwnerAuthService.cs`
- [ ] `Services/OwnerAuthorizeFilter.cs`
- [ ] `Controllers/AuthController.cs`
- [ ] `GET /api/v1/bookings/availability`
- [ ] ปิด `GET /api/v1/bookings` + เพิ่ม `search`
- [ ] `PATCH /api/v1/bookings/{id}/status`
- [ ] ลงทะเบียนใน `Program.cs`
- [ ] ทดสอบผ่าน Swagger: login → เอา token → GET/PATCH