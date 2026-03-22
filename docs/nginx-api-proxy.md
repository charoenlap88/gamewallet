# Nginx — proxy API ไป Nest (GameWallet)

Frontend เรียก `VITE_API_URL` เช่น `https://www.playpaytopup.com/api/v1/...`

Backend Nest ใช้ `app.setGlobalPrefix('api/v1')` ดังนั้น path บน Node คือ `/api/v1/...`

## แนะนำ (ส่ง path ตรงไปที่พอร์ต 3000)

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';

    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;

    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

ใช้ `proxy_pass http://127.0.0.1:3000/api/;` (มี `/api/` ต่อท้าย) เพื่อให้คำขอ `https://โดเมน/api/v1/...` ไปที่ `http://127.0.0.1:3000/api/v1/...` ตรงกับ Nest

## ถ้าใช้แบบนี้ (ไม่แนะนำกับ Nest ปัจจุบัน)

```nginx
proxy_pass http://127.0.0.1:3000/;
```

Nginx จะ **ตัด** prefix ที่ match `location /api/` แล้วส่งต่อ เช่น `/api/v1/foo` กลายเป็น `http://127.0.0.1:3000/v1/foo` (**ไม่มี** `/api`) จะไม่ตรงกับ globalPrefix `api/v1` — ต้องแก้เป็นแบบด้านบน หรือเปลี่ยน prefix ใน Nest ให้ตรงกับ nginx
