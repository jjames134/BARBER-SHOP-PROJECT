# 🔐 Secret Management Guide

คู่มือการจัดการ Secrets สำหรับ Barber Shop Project

## 📋 Secrets ที่ต้องจัดการ

| Variable | Purpose | Example |
|----------|---------|---------|
| `SECRET_KEY` | JWT token signing key | `your-secret-key-here-min-32-chars` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `EMAIL` | Gmail account for OTP | `barberadmin1@gmail.com` |
| `PASS_APP` | Gmail App Password (NOT regular password) | `wtcqpsrbzxedyhro` |

---

## 🚀 สำหรับ Local Development

### 1. สร้างไฟล์ `.env` ในโฟลเดอร์ `backend/`

```bash
# backend/.env
SECRET_KEY=your-secret-key-here-change-this-in-production
ALGORITHM=HS256
EMAIL=barberadmin1@gmail.com
PASS_APP=wtcqpsrbzxedyhro
DATABASE_URL=sqlite:///./test.db
```

### 2. เพิ่ม `.env` ลงใน `.gitignore`

```bash
# ใน root directory ของ project ให้เพิ่ม:
backend/.env
.env
.env.local
```

### 3. ปลอดภัยในการ Commit

```bash
# ตรวจสอบให้แน่ใจว่าไม่มี secrets ใน git history
git status  # ต้อง ไม่มี .env ปรากฏ
```

---

## 🐳 สำหรับ Docker Deployment

### ตัวเลือก 1: .env file (Local Testing)

```bash
# รันด้วย .env
docker run --env-file backend/.env -p 8000:8000 barber-shop-backend
```

### ตัวเลือก 2: Docker Compose with .env

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    image: backend:latest
    env_file:
      - backend/.env
    ports:
      - "8000:8000"
```

### ตัวเลือก 3: Pass directly (Preferred for Production)

```bash
docker run \
  -e SECRET_KEY="your-secret-key" \
  -e ALGORITHM="HS256" \
  -e EMAIL="barberadmin1@gmail.com" \
  -e PASS_APP="wtcqpsrbzxedyhro" \
  -p 8000:8000 \
  barber-shop-backend
```

---

## 🚆 สำหรับ Railway.app Deployment

### ขั้นตอน:

1. **เข้า Railway Dashboard**
   - ไปที่ https://railway.app/dashboard
   - เลือก Project ของคุณ

2. **ตั้ง Environment Variables**
   - ไปที่ **Variables** tab
   - เพิ่ม secrets ตามนี้:

```
SECRET_KEY = your-secret-key-here (gen at least 32 chars)
ALGORITHM = HS256
EMAIL = barberadmin1@gmail.com
PASS_APP = wtcqpsrbzxedyhro
```

3. **ใช้ Railway CLI (Optional)**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Set variables
railway variables set SECRET_KEY "your-secret-key"
railway variables set ALGORITHM "HS256"
railway variables set EMAIL "barberadmin1@gmail.com"
railway variables set PASS_APP "wtcqpsrbzxedyhro"

# Deploy
railway up
```

---

## 🔑 Secret Key Generation

ต้องสร้าง `SECRET_KEY` ที่แข็งแกร่ง:

### Python:
```python
import secrets
secret_key = secrets.token_urlsafe(32)
print(secret_key)
```

### Bash:
```bash
openssl rand -hex 32
```

### Node.js:
```javascript
require('crypto').randomBytes(32).toString('hex')
```

**ตัวอย่าง:** `Ks8dJk9mL0pQrSt2uVwXyZ1aBcDeFgHiJkLmNoPqRsT3uVw`

---

## ⚠️ Gmail App Password (สำคัญมาก!)

**ไม่ใช้ regular password** ให้ใช้ **App Password** แทน:

### วิธีสร้าง:

1. ไปที่ https://myaccount.google.com/security
2. เปิด **2-Step Verification** (ต้องทำก่อน)
3. ไปที่ **App passwords** (ด้านล่าง 2-Step Verification)
4. เลือก:
   - App: **Mail**
   - Device: **Windows (หรือ device ของคุณ)**
5. Google จะให้ password 16 ตัวอักษร เช่น: `wtcqpsrbzxedyhro`
6. **เก็บไว้ที่ปลอดภัย** - จะแสดงเพียงครั้งเดียว

---

## 🛡️ Best Practices

### ✅ ทำ:
- ✅ ใช้ environment variables เสมอ
- ✅ เตรียม `.env.example` ให้ team ดู structure
- ✅ เก็บ `.env` ใน `.gitignore`
- ✅ ใช้ 32+ ตัวอักษรสำหรับ SECRET_KEY
- ✅ ใช้ GitHub Secrets หรือ Railway Secrets
- ✅ Rotate secrets ทุก 6-12 เดือน
- ✅ ใช้ unique SECRET_KEY ต่อ environment (dev, staging, prod)

### ❌ ห้ามทำ:
- ❌ Commit `.env` ลง git
- ❌ ใช้ hardcoded secrets ใน code
- ❌ ใช้ regular Gmail password (ต้อง App Password)
- ❌ Share secrets ใน Slack/Email
- ❌ ใช้ secret เดียวกันในหลาย environments

---

## 📝 .env.example (สำหรับ Team)

สร้างไฟล์ `backend/.env.example` เพื่อให้ team ดู structure:

```bash
# backend/.env.example
SECRET_KEY=change-this-in-production-use-min-32-chars
ALGORITHM=HS256
EMAIL=your-gmail@gmail.com
PASS_APP=your-16-digit-app-password
DATABASE_URL=sqlite:///./test.db
```

**Commit ไฟล์นี้ลง git!** ไม่มี secrets ที่แท้จริง

---

## 🔄 Setup Checklist

- [ ] สร้าง SECRET_KEY ที่ strong
- [ ] ขอ Gmail App Password
- [ ] สร้างไฟล์ `backend/.env`
- [ ] เพิ่ม `backend/.env` ลง `.gitignore`
- [ ] สร้าง `backend/.env.example`
- [ ] Set variables บน Railway
- [ ] Test local development
- [ ] Test production deployment
- [ ] Document ให้ team ทราบ

---

## ❓ Troubleshooting

### OTP Email ไม่ส่ง
```
Error: EMAIL or PASS_EMAIL is not set in environment variables
```
**วิธีแก้:** ตรวจสอบ `EMAIL` และ `PASS_APP` ใน environment

### JWT Token Error
```
Error: SECRET_KEY is None
```
**วิธีแก้:** ตรวจสอบว่า `SECRET_KEY` ถูกตั้งค่าแล้ว

### Railway Deployment Failed
```
Build failed: Command exited with non-zero status code: 1
```
**วิธีแก้:** ตรวจสอบ Railway Variables เสร็จหรือยัง

---

## 📞 Support

หากมีปัญหา:
1. ตรวจสอบให้แน่ใจว่ามี `python-dotenv` ใน requirements.txt
2. ตรวจสอบ `app/email_service.py` ใช้ `os.getenv()` อยู่หรือ
3. ดู logs: `railway logs` หรือ `docker logs`
