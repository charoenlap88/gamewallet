# เช็คความครบถ้วนกับเอกสาร (overall-system / prompt-ruld-std / prompt-rule)

อัปเดตล่าสุด: สำหรับโค้ดใน repo นี้ (NestJS + Prisma + PostgreSQL, Frontend React + MUI)

## สรุปภาพรวม

| หมวด | สถานะ |
|------|--------|
| Phase 1 — ฟีเจอร์หลัก (Auth, Wallet, สินค้า, Order, Admin พื้นฐาน) | **ทำแล้วส่วนใหญ่** |
| Multi-supplier (เปรียบเทียบราคา, mapping, API key) | **ทำแล้วระดับ API + หน้า Admin** |
| Queue / Kafka / Worker แยก | **ยังไม่ครบ** (ออกแบบในเอกสาร แต่ยังไม่มี worker แยกตามสเปก) |
| โปรโมชั่น / Pricing แยก / Role & Permission UI | **ยังไม่ครบ** |
| **i18n (ไทย / อังกฤษ / จีนตัวย่อ / มาเลย์)** | **ทำแล้ว (หลัก)** — ดู `docs/I18N.md` · หน้ารองบางหน้าอาจยังมีข้อความคงที่ |
| แจ้งเตือน (LINE/Slack ฯลฯ) | **ยังไม่มี** |
| System monitor / Queue status บน Dashboard | **บางส่วน** (dashboard มีสถิติหลัก ไม่มี queue depth) |

---

## 1. Customer (ตาม prompt-ruld-std & overall-system 2.1)

| รายการ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| สมัคร / Login / Logout | ✅ | `/register`, `/login` |
| โปรไฟล์ | ✅ | `/profile` + `PATCH /users/me` |
| Wallet เติมเงิน / ยอด / ประวัติ | ✅ | `/wallet` |
| รายการสินค้า / รายละเอียด / ซื้อ | ✅ | `/products`, `/products/:id` |
| ประวัติคำสั่งซื้อ | ✅ | `/orders` |
| **Payment history** | ✅ | `/payments` (เรียก `GET /payments/my`) |

---

## 2. Admin (ตามเอกสาร)

| รายการ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| Dashboard (รายได้, ออเดอร์, ฯลฯ) | ✅ | `/admin/dashboard` |
| User management | ✅ | `/admin/users` |
| Product + Category | ✅ | `/admin/products`, `/admin/products/categories` |
| Supplier + API Keys + Mapping | ✅ | `/admin/suppliers`, `/admin/suppliers/api-keys` (mapping ใน Suppliers) |
| Orders | ✅ | `/admin/orders` |
| Payments | ✅ | `/admin/payments` |
| Analytics | ✅ | `/admin/analytics` — สรุปยอดช่วงเวลา, รายได้รายวัน, สถานะออเดอร์, หมวดขายดี, top products |
| Audit log | ✅ | `/admin/audit-logs` — กรอง module/action/ค้นหา, ดู JSON before/after; backend บันทึก login/register, user status, order cancel/retry, product/category CRUD |
| **Promotion management** | ❌ | ยังไม่มีหน้า + API โปรโมชั่น |
| **Pricing management** (แยกจากสินค้า) | ⚠️ | ราคาขายอยู่ในฟอร์มสินค้า — ไม่มีเมนู “จัดการราคา” แยก |
| **Role & Permission UI** | ❌ | มี RBAC ใน backend แต่ยังไม่มีหน้าจัดการ role |
| **Retry failed jobs / Queue UI** | ⚠️ | มี retry order item ใน API — ไม่มีหน้า “คิวงาน” แยก |
| **System monitor** | ❌ | ตาม overall-system 5.x |
| **เมนู Master data แบบเต็ม** (Payment Channel, Endpoint config ฯลฯ) | ⚠️ | บางส่วนอยู่ใน seed/schema — ไม่ครบทุกเมนูใน UI |

---

## 3. Backend / Integration (ตาม prompt-rule)

| รายการ | สถานะ | หมายเหตุ |
|--------|--------|----------|
| JWT + RBAC | ✅ | |
| PostgreSQL + Prisma | ✅ | |
| Webhook payment (endpoint) | ✅ | โครงสร้างมีใน controller |
| ไม่เรียก Supplier จาก browser โดยตรง | ✅ | ผ่าน API backend |
| **Redis / Kafka ใน runtime** | ⚠️ | compose มี redis — ยังไม่ได้ผูก queue เต็มรูปแบบตาม blueprint |
| Encrypt API keys | ✅ | ตามที่ implement ใน backend |
| Rate limiting | ⚠️ | ควรตรวจว่ามี global guard หรือยัง |

---

## 4. UI/UX (ตามเอกสาร)

| รายการ | สถานะ |
|--------|--------|
| MUI + ธีมแดง | ✅ (ปรับเป็นโทนแดง–ดำแบบพรีเมียม + responsive) |
| แยก Customer / Admin layout | ✅ |
| Sidebar admin | ✅ (+ drawer บนมือถือ) |
| Top nav customer | ✅ (+ เมนูมือถือ) |
| Loading / empty / error | ⚠️ บางหน้า — ปรับต่อได้ |

---

## 5. ขั้นตอนถัดไป (ถ้าต้องการ “ครบ 100%” ตาม blueprint)

1. โมดูล **Promotion** (schema + API + หน้า Admin)
2. หน้า **Role/Permission** สำหรับ Super Admin
3. **Worker + Queue** (BullMQ/Redis หรือ Kafka consumer) แยกการยิง Supplier
4. **System health / queue depth** บน Dashboard
5. ช่องทาง **แจ้งเตือน** (email/LINE/Slack) แบบ optional

ไฟล์นี้ใช้เป็น checklist กับทีม — ฟีเจอร์ที่ทำแล้วใน repo จะสะท้อนในโค้ดจริง ไม่ใช่แค่เอกสารออกแบบ
