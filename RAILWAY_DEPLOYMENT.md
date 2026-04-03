# 🚀 Quick Deploy Guide for Railway

## วิธีใช้ Secrets บน Railway.app

### ขั้นตอน 1: สร้าง Strong SECRET_KEY

ใช้ Python:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

ตัวอย่างผลลัพธ์:
```
Ks8dJk9mL0pQrSt2uVwXyZ1aBcDeFgHiJkLmNoPqRsT3uVw
```

### ขั้นตอน 2: ตั้ง Variables บน Railway

**วิธีที่ 1: ผ่าน Railway Dashboard (ง่ายที่สุด)**

1. เข้า https://railway.app/dashboard
2. เลือก Barber Shop Project
3. ไปที่ **Variables** tab
4. กด **New Variable** แล้วเพิ่ม:

| Key | Value |
|-----|-------|
| SECRET_KEY | `Ks8dJk9mL0...` (ใช้ที่สร้างไว้) |
| ALGORITHM | `HS256` |
| EMAIL | `barberadmin1@gmail.com` |
| PASS_APP | `wtcqpsrbzxedyhro` |
| CORS_ORIGINS | `https://your-frontend-domain.com` |

📌 **ตัวอย่าง Railway URLs:**
- Backend: https://barber-shop-backend-production.up.railway.app
- Frontend: https://barber-shop-production.up.railway.app

---

**วิธีที่ 2: ผ่าน Railway CLI**

```bash
# 1. ติดตั้ง Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link ไปยัง project
railway link  # เลือก Barber Shop project

# 4. ตั้ง variables
railway variables set SECRET_KEY "Ks8dJk9mL0pQrSt2uVwXyZ1aBcDeFgHiJkLmNoPqRsT3uVw"
railway variables set ALGORITHM "HS256"
railway variables set EMAIL "barberadmin1@gmail.com"
railway variables set PASS_APP "wtcqpsrbzxedyhro"
railway variables set CORS_ORIGINS "https://your-frontend-domain.com"

# 5. Deploy
railway up
```

### ขั้นตอน 3: ตั้งค่าอื่น ๆ ที่จำเป็น

หาก Railway auto-detected database:
- ตรวจสอบ `DATABASE_URL` ว่าถูกต้อง (Railway มักสร้าง PostgreSQL)
- อัพเดท `backend/.env.example` ให้ match

---

## 📋 Checklist ก่อน Deploy

- [ ] สร้าง SECRET_KEY (min 32 chars)
- [ ] ขอ Gmail App Password 
- [ ] ตั้ง 5 variables บน Railway
- [ ] Test ทดลองขอ OTP จาก frontend
- [ ] ตรวจสอบ logs: `railway logs`

---

## 🔍 ตรวจสอบการ Deploy

หลัง deploy สำเร็จ:

```bash
# ดู logs บน Railway CLI
railway logs

# ดู Environment Variables ที่เซ็ตไว้
railway variables

# ทดสอบ OTP endpoint
curl -X POST https://backend-url/auth/send_OTP?email=test@example.com&purpose=register
```

---

## ❌ Common Issues & Fix

### Issue 1: "EMAIL or PASS_EMAIL is not set"
```
Error: EMAIL or PASS_EMAIL is not set in environment variables
```
**Fix:** ตรวจสอบ Railway Variables ว่ามี EMAIL และ PASS_APP ไหม

### Issue 2: JWT Token Error
```
Error: 'NoneType' object has no attribute '__getitem__'
```
**Fix:** ตรวจสอบ SECRET_KEY ใน Railway Variables

### Issue 3: CORS Error
```
Cross-origin request blocked
```
**Fix:** Update `CORS_ORIGINS` ให้ตรงกับ frontend URL

---

## 🔐 Best Practice: Railway Secrets (Optional)

Railway มี built-in secret manager:

```bash
# อ่าน secret
railway variables get SECRET_KEY

# ลบ secret
railway variables delete SECRET_KEY

# ดูทั้งหมด
railway variables
```

---

## 📝 Local Testing ก่อน Deploy

```bash
# 1. สร้าง .env ในโฟลเดอร์ backend/
cp backend/.env.example backend/.env

# 2. แก้ไข .env ด้วย secrets จริง
nano backend/.env

# 3. ทดสอบเรียก API
cd backend
uvicorn app.main:app --reload

# UI จะรันที่ http://localhost:8000/docs
```

---

## 🚀 One-Command Deploy

หลังจาก set variables บน Railway:

```bash
railway up --detach
```

จะทำให้:
1. Build image ใหม่
2. Deploy ไปยัง Railway
3. ใช้ environment variables ที่ตั้งไว้

---

## 📞 ถ้ามีปัญหา

1. ตรวจสอบ Railway Logs:
   ```bash
   railway logs --follow  # Real-time logs
   ```

2. ดู variables ที่ตั้งไว้:
   ```bash
   railway variables
   ```

3. สร้าง config file:
   ```bash
   railway init  # Regenerate config
   ```

---

**Tips:** บันทึก SECRET_KEY และ PASS_APP ไว้ที่ปลอดภัย (e.g., 1Password, LastPass) หลังจาก deploy สำเร็จ!
