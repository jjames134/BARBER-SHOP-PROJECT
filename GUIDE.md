# 📖 Barber Shop Project - คู่มือเบื้องต้น

## 📋 สารบัญ
- [ภาพรวมโปรเจกต์](#ภาพรวมโปรเจกต์)
- [สถาปัตยกรรม](#สถาปัตยกรรม)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การติดตั้ง](#การติดตั้ง)
- [ฐานข้อมูล](#ฐานข้อมูล)
- [API จำเป็น](#api-จำเป็น)
- [คอมโพเนนต์ Frontend](#คอมโพเนนต์-frontend)
- [ฟีเจอร์หลัก](#ฟีเจอร์หลัก)
- [การใช้งาน](#การใช้งาน)
- [Deployment](#deployment)

---

## ภาพรวมโปรเจกต์

**Barber Shop Project** เป็นระบบการจองคิวสำหรับร้านตัดผม แบบเต็มสแต็ก (Full-Stack) ที่สามารถจัดการ:
- 👥 ลูกค้าออนไลน์และเดินเข้า
- 💇 การจัดการพนักงานและเจ้าของร้าน
- 📅 ระบบตารางเวลาและคิว
- 🔔 การแจ้งเตือนแบบเรียลไทม์
- 📧 ระบบ OTP และการรีเซ็ตรหัสผ่าน

**เวอร์ชั่น:** 2.0.0

---

## สถาปัตยกรรม

```
┌─────────────────────────────────────────┐
│         Frontend (React + Vite)         │
│  - SPA with React Router                │
│  - TailwindCSS + CSS modules            │
│  - Axios for API calls                  │
│  - Sweet Alert2 for notifications       │
└──────────────┬──────────────────────────┘
               │ HTTP/CORS
┌──────────────▼──────────────────────────┐
│      Backend (FastAPI/Python)           │
│  - RESTful API                          │
│  - APScheduler for background tasks     │
│  - SQLAlchemy ORM                       │
│  - JWT Authentication                   │
│  - Email & SMS Services                 │
└──────────────┬──────────────────────────┘
               │ SQL
┌──────────────▼──────────────────────────┐
│    Database (SQLAlchemy/SQLite)         │
│  - Users & Authentication               │
│  - Queue Management                     │
│  - Booking & Notifications              │
└─────────────────────────────────────────┘
```

---

## เทคโนโลยีที่ใช้

### Backend
- **Framework:** FastAPI 0.129.0 - API framework สำหรับ Python
- **Database:** SQLAlchemy ORM + SQLAlchemy Core
- **Authentication:** JWT (JSON Web Tokens)
- **Background Tasks:** APScheduler 3.11.2
- **Email Service:** FastAPI-Mail 1.6.2
- **TTS:** edge-tts 7.2.8 (Text-to-Speech)
- **Validation:** pydantic (embedded in FastAPI)

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 7.3.1
- **Routing:** React Router DOM 6.30.3
- **Styling:** TailwindCSS 3.4.19
- **HTTP Client:** Axios 1.14.0
- **Icons:** React Icons 5.6.0
- **Alerts:** SweetAlert2 11.26.24
- **JWT Decode:** jwt-decode 4.0.0

### DevOps
- **Containerization:** Docker
- **Container Orchestration:** Docker Compose
- **Web Server (Frontend):** Nginx
- **Deployment:** Railway

---

## โครงสร้างโปรเจกต์

```
Barber-Shop-Project/
├── backend/                          # Backend Application
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── auth.py                  # Authentication routes
│   │   ├── model.py                 # Database models
│   │   ├── database.py              # Database connection
│   │   ├── schemas.py               # Pydantic request/response schemas
│   │   ├── security.py              # JWT & password hashing
│   │   ├── barber_manage.py         # Barber management routes
│   │   ├── queue_service.py         # Queue booking routes
│   │   ├── data_service.py          # Data fetching routes
│   │   ├── rolebase.py              # Role-based access control
│   │   ├── email_service.py         # Email sending service
│   │   ├── notification_service.py  # Notification management
│   │   ├── backtask.py              # Background scheduled tasks
│   │   ├── requirements.txt         # Python dependencies
│   │   └── Dockerfile              # Docker configuration
│   ├── env/                         # Python Virtual Environment
│   └── static/                      # Static files (profile images)
│
├── frontend/                        # Frontend Application
│   ├── src/
│   │   ├── App.jsx                 # Main app & routing
│   │   ├── main.jsx                # React entry point
│   │   ├── index.css               # Global styles
│   │   ├── App.css                 # App styles
│   │   ├── DataContext.jsx         # Global state context
│   │   ├── component/
│   │   │   ├── Home.jsx            # Home page
│   │   │   ├── LoginPage.jsx       # Login form
│   │   │   ├── RegisterPage.jsx    # Registration form
│   │   │   ├── SelectChairPage.jsx # Chair/barber selection
│   │   │   ├── QueuesPage.jsx      # Queue/booking page
│   │   │   ├── ViewBookedPage.jsx  # Customer's bookings
│   │   │   ├── BookingCustomerPage.jsx
│   │   │   ├── WorkTablePage.jsx   # Employee's work schedule
│   │   │   ├── DashBoardPage.jsx   # Owner's dashboard
│   │   │   ├── ManageUser.jsx      # User management
│   │   │   ├── ShopSetting.jsx     # Shop settings
│   │   │   ├── CustomWebPage.jsx   # Web customization
│   │   │   ├── NotificationPage.jsx # Notifications
│   │   │   ├── ProfilePage.jsx     # User profile
│   │   │   ├── EditProfilePage.jsx # Profile editing
│   │   │   ├── ChangePasswordPage.jsx
│   │   │   ├── ResetPasswordPage.jsx
│   │   │   ├── LeaveLetterPage.jsx # Leave request form
│   │   │   ├── LeaveDetailPage.jsx
│   │   │   ├── RequireRole.jsx     # Role-based route guard
│   │   │   ├── Layout.jsx          # Main layout wrapper
│   │   │   ├── style/              # Component-specific CSS
│   │   │   └── Image/              # Component images
│   │   └── assets/
│   ├── public/                      # Static public files
│   ├── package.json                # Dependencies
│   ├── vite.config.js              # Vite configuration
│   ├── tailwind.config.js          # TailwindCSS config
│   ├── nginx.conf                  # Nginx configuration
│   ├── nginx-default.conf
│   └── Dockerfile
│
├── docker-compose.yml              # Multi-container setup
├── Dockerfile                      # Main Dockerfile
├── Procfile                        # Process file for Railway
├── railway.toml                    # Railway deployment config
├── README.md
└── DOCKER_GUIDE.md                 # Docker usage guide
```

---

## การติดตั้ง

### ⚙️ ความต้องการ
- Python 3.8+
- Node.js 16+
- Docker & Docker Compose (สำหรับ containerization)
- Git

### 🚀 วิธีติดตั้ง (Development)

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Barber-Shop-Project
```

#### 2. Backend Setup
```bash
cd backend

# สร้าง Python virtual environment
python -m venv env

# Activate environment
# Windows:
env\Scripts\activate
# macOS/Linux:
source env/bin/activate

# ติดตั้ง dependencies
pip install -r app/requirements.txt
```

#### 3. Frontend Setup
```bash
cd frontend

# ติดตั้ง npm packages
npm install

# (Optional) ติดตั้ง react-icons ถ้ายังไม่มี
npm install react-icons
```

#### 4. Environment Configuration
สร้างไฟล์ `.env` ใน `backend/app/`:
```env
DATABASE_URL=sqlite:///db.sqlite
SECRET_KEY=your-secret-key-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

#### 5. รันแอปพลิเคชัน

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn app.main:app --reload
# API จะทำงานที่ http://localhost:8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# UI จะทำงานที่ http://localhost:5173
```

---

## ฐานข้อมูล

### 📊 ตารางหลัก

#### 1. **Users Table**
จัดเก็บข้อมูลผู้ใช้ (ลูกค้า, พนักงาน, เจ้าของ)

```python
class User(Base):
    id: int (Primary Key)
    username: str (Unique)
    password_hash: str
    firstname: str
    lastname: str (Optional)
    email: str (Unique)
    phone: str
    rolestatus: UserRole (CUSTOMER, EMPLOYEE, OWNER)
    profile_img: str (Image path)
    last_activity: datetime
    create_at: datetime
    update_at: datetime
```

**User Roles:**
- `CUSTOMER` - ลูกค้าปกติ
- `EMPLOYEE` - พนักงาน/ช่างตัดผม
- `OWNER` - เจ้าของร้าน

---

#### 2. **PreUser Table**
จัดเก็บข้อมูลผู้ใช้ที่ยังไม่ยืนยัน (ระหว่างการลงทะเบียนหรือรีเซ็ตรหัสผ่าน)

```python
class PreUser(Base):
    id: int (Primary Key)
    username: str
    email: str
    phone: str
    password_hash: str
    purpose: PreUserStatus (REGISTER, RESET_PASSWORD, CHANGE_EMAIL)
    otp_code: str
    otp_expire: datetime
    otp_attempts: int
    is_verified: bool
```

**OTP Verification Flow:**
1. ผู้ใช้กรอกข้อมูล → สร้าง PreUser
2. ส่ง OTP ไปยังอีเมล
3. ผู้ใช้ตรวจสอบ OTP
4. ถ่ายโอนข้อมูลไปที่ User table

---

#### 3. **Barber Table**
ข้อมูลพนักงาน

```python
class Barber(Base):
    id: int (Primary Key)
    user_id: int (Foreign Key → User)
    user_data: User (Relationship)
    leave_letter: List[LeaveLetter]
```

---

#### 4. **Chair Table**
ข้อมูลเก้าอี้/ช่องทำงาน

```python
class Chair(Base):
    id: int (Primary Key)
    name: str (ชื่อเก้าอี้)
    barber_id: int (Foreign Key → Barber, Optional)
    queues: List[QueueSlots]
```

---

#### 5. **QueueSlots Table**
ข้อมูลคิวและการจองคิว

```python
class QueueSlots(Base):
    id: int (Primary Key)
    chair_id: int (Foreign Key → Chair)
    start_time: time (เวลาเริ่ม)
    end_time: time (เวลาสิ้นสุด)
    date_working: date (วันที่จองคิว)
    customer_id: int (Foreign Key → User, Optional)
    status: BookedStatus (AVAILABLE, BOOKED, CHECKIN, COMPLETE, CANCELLED, NO_SHOW)
    status_user: TypeUser (WALK_IN, ONLINE, NONE)
    
    # Constraints: 
    # - end_time > start_time
    # - Unique(chair_id, date_working, start_time)
```

**Queue Statuses:**
| Status | ความหมาย |
|--------|---------|
| AVAILABLE | ช่องว่าง พร้อมจอง |
| BOOKED | จองแล้ว รอลูกค้า |
| CHECKIN | ลูกค้าเช็คอินแล้ว |
| COMPLETE | เสร็จสิ้น |
| CANCELLED | ยกเลิก |
| NO_SHOW | ลูกค้าไม่มา |

---

#### 6. **LeaveLetter Table**
คำขอลาของพนักงาน

```python
class LeaveLetter(Base):
    id: int (Primary Key)
    barber_id: int (Foreign Key → Barber)
    report: str (เหตุผลการลา)
    date_leave: date (วันที่ลา)
    status: LeaveStatus (PENDING, APPROVED, REJECTED)
    created_at: datetime
```

---

#### 7. **Notification Table**
การแจ้งเตือนของผู้ใช้

```python
class Notification(Base):
    id: int (Primary Key)
    user_id: int (Foreign Key → User)
    type: NotificationType
    title: str
    message: str
    is_read: bool
    created_at: datetime
```

**Notification Types:**
- `QUEUE_BOOKED` - ยืนยันการจองคิว
- `QUEUE_CANCELLED` - คิวถูกยกเลิก
- `QUEUE_REMINDER` - แจ้งเตือนก่อนถึงคิว
- `LEAVE_APPROVED` - จดหมายลาอนุมัติ
- `LEAVE_REJECTED` - จดหมายลาปฏิเสธ
- `SYSTEM` - ข้อความระบบ

---

## API จำเป็น

### 🔐 Authentication Routes (`/auth/*`)

#### 1. ลงทะเบียน
**POST** `/auth/register`
```json
// Request
{
  "username": "john_doe",
  "password": "password123",
  "firstname": "John",
  "lastname": "Doe",
  "email": "john@example.com",
  "phone": "0812345678"
}

// Response (201 Created)
{
  "message": "ส่ง OTP ไปยังอีเมลของคุณแล้ว"
}
```

#### 2. ตรวจสอบ OTP
**POST** `/auth/verify-otp`
```json
// Request
{
  "email": "john@example.com",
  "otp": "123456"
}

// Response (200 OK)
{
  "message": "ลงทะเบียนสำเร็จ"
}
```

#### 3. เข้าสู่ระบบ
**POST** `/auth/login`
```json
// Request
{
  "username": "john_doe",
  "password": "password123"
}

// Response (200 OK)
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "john_doe",
    "role": "CUSTOMER",
    "firstname": "John"
  }
}
```

#### 4. รีเซ็ตรหัสผ่าน
**POST** `/auth/request-password-reset`
```json
{
  "email": "john@example.com"
}
```

**POST** `/auth/reset-password`
```json
{
  "email": "john@example.com",
  "otp": "123456",
  "new_password": "newpassword123"
}
```

---

### 📅 Queue Service Routes (`/queue/*`)

#### 1. ดึงข้อมูลคิวทั้งหมด
**GET** `/queue/all?date=2024-01-15`
```json
// Response
{
  "chairs": [
    {
      "chair_id": 1,
      "chair_name": "Chair 1",
      "slots": [
        {
          "id": 101,
          "start_time": "09:00",
          "end_time": "09:30",
          "status": "AVAILABLE",
          "customer": null
        }
      ]
    }
  ]
}
```

#### 2. จองคิว
**POST** `/queue/book`
```json
// Request
{
  "queue_slot_id": 101
}

// Response (201 Created)
{
  "message": "จองคิวสำเร็จ",
  "queue_id": 101
}
```

#### 3. ยกเลิกการจอง
**POST** `/queue/cancel/{queue_id}`
```json
// Response
{
  "message": "ยกเลิกการจองสำเร็จ"
}
```

#### 4. เช็คอินคิว
**POST** `/queue/checkin/{queue_id}`
```json
// Response
{
  "message": "เช็คอินสำเร็จ"
}
```

---

### 👥 Barber Management Routes (`/barber/*`)

#### 1. ดึงพนักงานทั้งหมด
**GET** `/barber/all`
```json
// Response
[
  {
    "id": 1,
    "user_id": 2,
    "firstname": "Tony",
    "lastname": "Bangkok",
    "phone": "0898765432"
  }
]
```

#### 2. ส่งคำขอลา
**POST** `/barber/leave-request`
```json
// Request
{
  "date_leave": "2024-01-20",
  "report": "ป่วย"
}

// Response (201 Created)
{
  "message": "ส่งคำขอลาสำเร็จ"
}
```

#### 3. ดึงคำขอลาทั้งหมด (Owner Only)
**GET** `/barber/leave-requests`

#### 4. อนุมัติ/ปฏิเสธคำขอลา (Owner Only)
**POST** `/barber/leave-request/{id}/approve`
**POST** `/barber/leave-request/{id}/reject`

---

### 📊 Data Routes (`/data/*`)

#### 1. ดึงข้อมูลแดชบอร์ด
**GET** `/data/dashboard`
```json
// Response
{
  "total_customers": 45,
  "total_employees": 5,
  "today_bookings": 12,
  "monthly_revenue": 15000
}
```

#### 2. ดึงสถิติรายละเอียด
**GET** `/data/statistics?date_from=2024-01-01&date_to=2024-01-31`

---

### 🔔 Notification Routes (`/notification/*`)

#### 1. ดึงการแจ้งเตือน
**GET** `/notification/`
```json
// Response
[
  {
    "id": 1,
    "type": "QUEUE_BOOKED",
    "title": "การจองคิวสำเร็จ",
    "message": "คุณจองคิวกับ Tony Bangkok ในวันที่ 15 มกราคม 09:00 - 09:30",
    "is_read": false,
    "created_at": "2024-01-15T08:30:00"
  }
]
```

#### 2. ทำเครื่องหมายว่าอ่านแล้ว
**PUT** `/notification/{id}/read`

---

## คอมโพเนนต์ Frontend

### 📱 Public Components (ไม่ต้อง Login)

#### 1. **Home.jsx**
หน้าหลักของแอปพลิเคชัน
- ข้อมูลร้านเบื้องต้น
- ปุ่มเข้าสู่ระบบและลงทะเบียน

#### 2. **LoginPage.jsx**
หน้าเข้าสู่ระบบ
- ฟิลด์: username, password
- การตรวจสอบข้อมูลประสิทธิ์

#### 3. **RegisterPage.jsx**
หน้าลงทะเบียน
- กรอกข้อมูลพื้นฐาน
- ยืนยัน OTP
- สร้างบัญชีใหม่

#### 4. **ResetPasswordPage.jsx**
หน้าเปลี่ยนรหัสผ่าน

---

### 🔒 Protected Components (ต้อง Login)

#### 5. **SelectChairPage.jsx**
หน้าเลือกเก้าอี้/ช่างตัด
- แสดงรายชื่อพนักงาน (ช่างตัด)
- เลือกเก้าอี้เพื่อดูคิว

#### 6. **QueuesPage.jsx**
หน้าดูคิวและจอง
- แสดงช่องว่างในวันนั้น
- ปุ่มจองคิว
- ยกเลิกการจอง

#### 7. **ProfilePage.jsx**
หน้าโปรไฟล์ผู้ใช้
- ข้อมูลส่วนตัว
- รูปโปรไฟล์

#### 8. **EditProfilePage.jsx**
หน้าแก้ไขโปรไฟล์
- อัพเดทข้อมูล
- เปลี่ยนรูปโปรไฟล์

#### 9. **NotificationPage.jsx**
หน้าการแจ้งเตือน
- ดูการแจ้งเตือนทั้งหมด
- ทำเครื่องหมายว่าอ่านแล้ว

---

### 👤 Customer-Only Components

#### 10. **ViewBookedPage.jsx**
หน้าดูการจองของฉัน
- แสดงการจองที่ผ่านมาและที่จะมา
- สถานะการจอง
- ปุ่มยกเลิก

---

### 💼 Employee-Only Components

#### 11. **WorkTablePage.jsx**
หน้าตารางการทำงาน
- ดูคิวที่ได้รับมอบหมาย
- เช็คอินลูกค้า
- ทำเครื่องหมายเสร็จสิ้น

#### 12. **LeaveLetterPage.jsx**
หน้าส่งคำขอลา
- เลือกวันที่ลา
- กรอกเหตุผล
- ส่งคำขอ

#### 13. **LeaveDetailPage.jsx**
หน้าแสดงรายละเอียดคำขอลา
- สถานะ (Pending/Approved/Rejected)

---

### 🔑 Owner-Only Components

#### 14. **DashBoardPage.jsx**
แดชบอร์ดจัดการ
- สถิติรายได้
- จำนวนลูกค้า/พนักงาน
- การจองวันนี้

#### 15. **ManageUser.jsx**
หน้าจัดการผู้ใช้
- เพิ่ม/แก้ไข/ลบผู้ใช้
- จัดสิทธิ์ (Role)
- ค้นหาผู้ใช้

#### 16. **ShopSetting.jsx**
หน้าตั้งค่าร้าน
- ตั้งเวลาเปิด-ปิด
- จำนวนเก้าอี้
- ระยะเวลาสำหรับแต่ละคิว

#### 17. **CustomWebPage.jsx**
หน้าปรับแต่งเว็บ
- เปลี่ยนสีพื้นหลัง
- ตั้งชื่อร้าน
- อัพโหลดโลโก้

---

### 🛡️ Special Components

#### 18. **RequireRole.jsx**
Component สำหรับ Role-Based Access Control
```jsx
// ใช้ในการห่อ routes ที่ต้องการสิทธิ์เฉพาะ
<Route element={<RequireRole allowRoles={["OWNER"]} />}>
  <Route path="/dashboard" element={<DashBoard />} />
</Route>
```

#### 19. **Layout.jsx**
Component หลักที่ห่อทั้ง App
- Navbar (Navigation)
- Footer
- Side menu (สำหรับ responsive)
- Outlet for nested routes

---

## ฟีเจอร์หลัก

### ✨ ฟีเจอร์ที่มี

#### 🎯 ระบบผู้ใช้
- ✅ สมัครสมาชิก/ลงทะเบียนด้วย OTP verification
- ✅ เข้าสู่ระบบ (Login)
- ✅ รีเซ็ตรหัสผ่าน
- ✅ เปลี่ยนรหัสผ่าน
- ✅ แก้ไขโปรไฟล์
- ✅ อัพโหลดรูปโปรไฟล์

#### 📅 ระบบคิว
- ✅ ดูคิวทั้งหมด
- ✅ จองคิว เลือกเก้าอี้/ช่างตัด
- ✅ ยกเลิกการจองคิว
- ✅ เช็คอินเมื่อถึงเวลา
- ✅ ระบบ No-Show (อัตโนมัติทำเครื่องหมายคนไม่มา)

#### 💼 ระบบพนักงาน
- ✅ ดูตารางการทำงาน
- ✅ ส่งคำขอลา
- ✅ ดูสถานะคำขอลา

#### 👑 ระบบเจ้าของร้าน
- ✅ จัดการผู้ใช้ (Add/Edit/Delete)
- ✅ ดูแดชบอร์ด สถิติ
- ✅ อนุมัติ/ปฏิเสธคำขอลา
- ✅ ตั้งค่าร้าน
- ✅ ปรับแต่งเว็บไซต์

#### 🔔 ระบบการแจ้งเตือน
- ✅ ส่งการแจ้งเตือนเมื่อจองคิวสำเร็จ
- ✅ แจ้งเตือนก่อนถึงคิว
- ✅ แจ้งเตือนปฏิเสธคำขอลา
- ✅ ระบบการแจ้งเตือนภายในระบบ

#### 📧 ระบบอีเมล
- ✅ ส่ง OTP ไปยังอีเมล
- ✅ ส่งการยืนยันการจองคิว
- ✅ ส่งแจ้งเตือนการเปลี่ยนแปลง

#### 🐳 Containerization
- ✅ Docker support
- ✅ Docker Compose setup
- ✅ Nginx เป็น reverse proxy

---

## การใช้งาน

### 🚀 เริ่มต้นใหม่

#### สำหรับดูเวอร์ชัน:
```bash
# Backend
curl http://localhost:8000/
# ตอบ: {"status": "ok", "version": "1.0.0"}

# Health check
curl http://localhost:8000/health
# ตอบ: {"status": "healthy"}
```

#### สำหรับผู้ใช้ทั่วไป:
1. ไปที่ http://localhost:5173
2. คลิก "สมัครสมาชิก"
3. กรอกข้อมูลและรับ OTP
4. ยืนยัน OTP
5. เข้าสู่ระบบ
6. ดูคิวและจองคิว

#### สำหรับพนักงาน:
1. เข้าสู่ระบบ
2. ไปที่ "ตารางการทำงาน"
3. เช็คอินลูกค้า
4. ส่งคำขอลาถ้าต้องการ

#### สำหรับเจ้าของร้าน:
1. เข้าสู่ระบบ (ต้องเป็น OWNER role)
2. ไปที่ "แดชบอร์ด" เพื่อดูสถิติ
3. ไปที่ "จัดการผู้ใช้" เพื่อเพิ่มพนักงาน
4. ไปที่ "ตั้งค่าร้าน" เพื่อตั้งค่าคิว

---

### 🔌 API Authentication

#### ใช้ JWT Token
```bash
# Step 1: Login
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"john_doe","password":"pass123"}'

# Response:
# {
#   "access_token": "eyJhbGc...",
#   "token_type": "bearer"
# }

# Step 2: ใช้ Token ใน Request
curl http://localhost:8000/queue/all \
  -H "Authorization: Bearer eyJhbGc..."
```

---

### 📊 Background Tasks

ระบบทำงานพื้นหลังด้วย APScheduler:

| Task | ความถี่ | ทำงาน |
|------|--------|-------|
| Check No-Show | ทุก 1 ชั่วโมง | ตรวจสอบคิวที่เลยเวลาและยังไม่เช็คอิน |
| OTP Cleanup | ทุก 1 ชั่วโมง | ลบ OTP ที่หมดอายุ |
| Send Reminders | ทุกวัน 08:00 | ส่งแจ้งเตือนคิวในวันนั้นสำหรับลูกค้า |

---

## Deployment

### 🐳 Using Docker

#### 1. ใช้ Docker Compose
```bash
docker-compose up -d
```

ตรวจสอบ services:
```bash
docker-compose ps
```

#### 2. ใช้ Docker แยกกัน

**Build Backend:**
```bash
cd backend
docker build -t barber-backend .
docker run -d -p 8000:8000 barber-backend
```

**Build Frontend:**
```bash
cd frontend
docker build -t barber-frontend .
docker run -d -p 80:80 barber-frontend
```

---

### 🚀 Railway Deployment

ไฟล์ `railway.toml` มีการตั้งค่า:
```yaml
[build]
builder = "dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
```

#### วิธี Deploy:
1. ก็อป `railway.toml` ไปยัง root
2. ใช้ Railway CLI:
```bash
railway link
railway up
```

---

### 📋 Checklist ก่อน Deploy

- ✅ ตั้ง Environment Variables
- ✅ เตรียม Database
- ✅ ตั้งค่า `.gitignore`
- ✅ ตรวจสอบ CORS origins
- ✅ ตั้ง Secret Key
- ✅ ทดสอบ API endpoints
- ✅ ทดสอบ Email service
- ✅ ตรวจสอบ static files

---

## 🛠️ Troubleshooting

### ❌ CORS Error
**ปัญหา:** Frontend ไม่สามารถเรียก Backend API
**แนวทาง:**
- ตรวจสอบ CORS origins ใน `main.py`
- ตรวจสอบว่า Frontend URL ตรงกับ CORS config

### ❌ Database Error
**ปัญหา:** ไม่สามารถเชื่อมต่อฐานข้อมูล
**แนวทาง:**
- ตรวจสอบ DATABASE_URL ใน `.env`
- รัน `python -c "from app.database import engine; engine.execute('SELECT 1')"`

### ❌ OTP Not Sending
**ปัญหา:** ไม่ได้รับอีเมล OTP
**แนวทาง:**
- ตรวจสอบตั้งค่า SMTP
- ตรวจสอบรหัสผ่านแอปพลิเคชัน Gmail
- ตรวจสอบ email logs

### ❌ Token Expired
**ปัญหา:** Authorization token หมดอายุ
**แนวทาง:**
- เข้าสู่ระบบใหม่ (login)
- เพิ่มสำนัก refresh token logic

---

## 📚 เอกสารเพิ่มเติม

ดู [DOCKER_GUIDE.md](./DOCKER_GUIDE.md) สำหรับคำแนะนำการใช้ Docker เพิ่มเติม

---

## 📝 หมายเหตุ

- ระบบใช้ SQLite เพื่อ development ใช้ PostgreSQL สำหรับ production
- OTP มีความถูกต้องเป็นเวลา 15 นาที
- Token JWT หมดอายุใน 24 ชั่วโมง
- ระบบมี Rate Limiting สำหรับ OTP attempts (max 3 ครั้ง)

---

**ข้อมูลขอบคุณ:** สร้างขึ้นเมื่อ 3 เมษายน 2567
**เวอร์ชั่น:** 2.0.0
