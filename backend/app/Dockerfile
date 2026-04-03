# 1. ใช้ Python 3.11 หรือเวอร์ชันที่คุณใช้พัฒนา
FROM python:3.11-slim

# 2. ตั้งค่าโฟลเดอร์ทำงาน
WORKDIR /app

# 3. ติดตั้ง Dependencies ที่จำเป็นสำหรับ MySQL (ถ้ามี)
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    nodejs \
    npm \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 4. ก๊อปปี้ไฟล์ requirements.txt มาลงก่อนเพื่อทำ Caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 5. ก๊อปปี้โค้ดทั้งหมด (รวมถึงโฟลเดอร์ย่อย) ตามไป
COPY . ./app

# 6. บอก Port ที่ FastAPI รัน (ปกติคือ 8000)
EXPOSE 8000

# 7. สั่งรันด้วย uvicorn
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]