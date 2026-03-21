# Omise — เติมเงินเข้า Wallet (สรุปจากเอกสารทางการ)

อ้างอิง: [Omise Thailand — เริ่มต้นใช้งาน](https://docs.omise.co/th/thailand) และเมนู **วิธีการชำระเงิน** / **API References** ในเอกสารเดียวกัน

## สิ่งที่ Omise คืออะไร

- **Payment gateway** ที่มี REST API และ Dashboard  
- รองรับ **บัตรเครดิต/เดบิต** และช่องทางอื่นในประเทศไทย เช่น **พร้อมเพย์ (QR)** — ดูรายละเอียดแต่ละช่องทางในเมนู *Payment Methods* ของเอกสาร  
- ใช้ **Test Dashboard** กับ **Test keys** (`pkey_test_...`, `skey_test_...`) ก่อนเปิด **Live**

## คีย์ที่ต้องใช้

| คีย์ | เก็บที่ไหน | หมายเหตุ |
|------|-------------|-----------|
| **Public Key** (`pkey_...`) | Backend `.env` (`OMISE_PUBLIC_KEY`) และถ้าใช้ Omise.js บนเบราว์เซอร์: `VITE_OMISE_PUBLIC_KEY` | ใช้ฝั่ง client ได้ (ไม่ลับ) |
| **Secret Key** (`skey_...`) | **เฉพาะ backend** (`OMISE_SECRET_KEY`) | ห้ามใส่ใน frontend / Git |

ดูคีย์ได้ที่ Dashboard เมนู **API** ตามที่เอกสารระบุ

## แนวทางรวมสำหรับ “เติมเงิน Wallet”

โปรเจกต์นี้ตอนนี้มี `POST /wallet/topup` ที่ **เพิ่มยอดทันที** (ไม่ผ่านเกตเวย์) — การผูก Omise จริงควรทำแบบ **ชำระสำเร็จก่อน แล้วค่อยเพิ่มยอด Wallet** เท่านั้น

### แนวทางที่ปลอดภัย (แนะนำ)

1. **ฝั่งลูกค้า**  
   - ใช้ **[Omise.js](https://docs.omise.co/omise-js)** สร้าง **token** จากข้อมูลบัตร (หรือใช้ **Source** สำหรับพร้อมเพย์ / ช่องทางอื่นตามคู่มือช่องทางนั้น)  
   - **ห้าม** ส่งเลขบัตรเต็มมาที่เซิร์ฟเวอร์ของคุณโดยตรง — ตาม [Security Best Practices](https://docs.omise.co/th/thailand) ในเอกสาร

2. **ฝั่งเซิร์ฟเวอร์ (มี Secret Key เท่านั้น)**  
   - เรียก Omise API สร้าง **Charge** (หรือ flow ที่เหมาะกับช่องทางนั้น)  
   - เก็บ `charge.id` หรือ reference ไว้ map กับ “รายการเติมเงินที่รอ” ของ user

3. **Webhook**  
   - ตั้ง **Webhook URL** ใน Dashboard ให้ชี้มาที่ endpoint ของคุณ (เช่น `/payments/webhooks/omise`)  
   - เมื่อสถานะ charge สำเร็จ ค่อย **เรียก logic เพิ่มยอด Wallet** (เทียบเท่า `WalletService.topup` แต่เรียกหลังยืนยันการชำระแล้วเท่านั้น)  
   - จัดการ **idempotency** (ไม่เติมซ้ำถ้า webhook ยิงซ้ำ) — เอกสารมีหัวข้อ **WebHooks** และ **Errors** ให้อ่านประกอบ

4. **สกุลเงิน**  
   - ประเทศไทยใช้ **THB (satang)** ใน API — ตรวจสอบจำนวนเงินเป็นสตางค์ตาม [เอกสารสกุลเงิน](https://docs.omise.co/th/thailand) / API reference

## สิ่งที่ยังต้องพัฒนาในโค้ด GameWallet (ถัดไป)

- [ ] โมเดล/สถานะ “รายการเติมเงินรอชำระ” (เช่น เก็บ `userId`, `amount`, `omiseChargeId`, `status`)  
- [ ] Endpoint สร้าง Charge + redirect/แสดง QR ตามช่องทาง  
- [ ] Webhook handler ยืนยันแล้วค่อย `topup`  
- [ ] ปิดหรือจำกัด `POST /wallet/topup` แบบตรงใน production ถ้าไม่ต้องการให้เติมมือ

## ตัวแปรสภาพแวดล้อมในโปรเจกต์นี้

- `backend/.env`: `OMISE_PUBLIC_KEY`, `OMISE_SECRET_KEY`  
- `frontend/.env`: `VITE_OMISE_PUBLIC_KEY` (ใช้เมื่อ integrate Omise.js)

ไฟล์ `.env` ถูก ignore จาก git — อย่า commit Secret Key

---

## API ที่มีในโปรเจกต์ (สร้าง Charge — ยังไม่เพิ่มยอด wallet)

**`POST /api/v1/wallet/omise/charges`** (ต้องมี `Authorization: Bearer <JWT>`)

Body (JSON):

| ฟิลด์ | บังคับ | คำอธิบาย |
|--------|--------|-----------|
| `amount` | ใช่ | จำนวนเงินเป็นบาท (1–500,000) |
| `card` | อย่างใดอย่างหนึ่งกับ `source` | Token จาก Omise.js (`tokn_...`) |
| `source` | อย่างใดอย่างหนึ่งกับ `card` | Omise Source id (เช่น พร้อมเพย์ `src_...`) |

Response (ตัวอย่าง):

```json
{
  "data": {
    "topupId": "uuid",
    "charge": {
      "id": "chrg_...",
      "status": "pending",
      "amount": 10000,
      "currency": "thb",
      "paid": false,
      "authorize_uri": "https://..."
    }
  }
}
```

- ระบบสร้างแถว `wallet_topups` สถานะ `PENDING` และเรียก Omise สร้าง Charge  
- ยอด **ยังไม่เข้า wallet** จนกว่า webhook จะยืนยัน (คุณจะทำต่อ)  
- `metadata.wallet_topup_id` ถูกใส่ใน Charge เพื่อให้ webhook map กลับมาได้  
- ใช้ `OmiseWalletService.findTopupByChargeId(chargeId)` ค้นหารายการจาก `chrg_...` ตอนทำ webhook

### Frontend

```ts
import { walletApi } from './api/wallet';
await walletApi.createOmiseTopupCharge({ amount: 100, card: tokenFromOmiseJs });
```
