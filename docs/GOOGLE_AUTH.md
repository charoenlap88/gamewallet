# Google Sign-In (ลูกค้า)

ระบบรองรับการสมัคร/เข้าสู่ระบบด้วย Google (OAuth 2.0) และสามารถใส่ **รหัสแนะนำ** ตอนสมัครผ่าน Google ได้ (ส่งจากหน้า Register)

## การตั้งค่า Google Cloud Console

1. สร้างโปรเจกต์หรือเลือกโปรเจกต์ที่มีอยู่
2. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. **Authorized JavaScript origins** (ตัวอย่าง dev):
   - `http://localhost:5173`
5. **Authorized redirect URIs** — สำหรับ Google Identity Services (ปุ่ม One Tap / popup) มักไม่จำเป็น แต่ถ้าใช้ redirect flow ให้เพิ่มตามที่ Google แนะนำ
6. คัดลอก **Client ID** (รูปแบบ `xxxxx.apps.googleusercontent.com`)

## ตัวแปรสภาพแวดล้อม

| ที่ | ตัวแปร | ค่า |
|----|--------|-----|
| Backend | `GOOGLE_CLIENT_ID` | Client ID เดียวกับ frontend |
| Frontend | `VITE_GOOGLE_CLIENT_ID` | Client ID เดียวกับ backend |

Backend ใช้ `google-auth-library` ตรวจสอบ **ID token** จากฝั่ง client ด้วย Client ID นี้

## พฤติกรรม

- ผู้ใช้ที่สมัครด้วย Google อาจไม่มีรหัสผ่านในระบบ (`hasPassword: false`) — เข้าสู่ระบบต่อด้วย Google
- บัญชีที่สมัครด้วยอีเมล/รหัสผ่านเดิม สามารถ **ผูก Google** ได้เมื่อลงชื่อเข้าใช้ Google ด้วยอีเมลเดียวกัน (ระบบจะอัปเดต `googleId`)
