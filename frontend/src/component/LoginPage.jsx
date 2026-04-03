import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { DataContext } from "../DataContext";
import { jwtDecode } from "jwt-decode";
import "./style/LoginPage.css";

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassWord] = useState('');
    const [faillenmessage, setFaillenMessage] = useState("");
    
    // ดึงฟังก์ชันมาจาก DataContext
    const { setRole, setIsLogin, fetchUserData, baseURL } = useContext(DataContext);

    async function submitLogin(e) {
        e.preventDefault();
        setFaillenMessage(""); // ล้างข้อความ Error เก่าก่อน

        if (!username || !password) {
            setFaillenMessage("กรุณากรอก username และ password ให้ครบถ้วน");
            return;
        }

        try {
            const res = await fetch(`${baseURL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                // 1. เก็บ Token ทั้งสองตัวลง LocalStorage
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);

                // 2. Decode เพื่อหา Role ทันที (สำหรับ Redirect หรือเช็คสิทธิ์เบื้องต้น)
                const decoded = jwtDecode(data.access_token);
                const userRole = decoded.role;

                // 3. อัปเดตสถานะใน Global Context
                setRole(userRole);
                setIsLogin(true);

                // 4. 🔥 สั่งให้โหลดข้อมูล Profile (ชื่อ, รูปภาพ) ทันที
                await fetchUserData();

                // 5. พากลับไปหน้าแรก
                navigate("/");
            } else {
                // แสดง Error ที่ส่งมาจาก Backend (เช่น Invalid credentials)
                setFaillenMessage(data.detail || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
            }
        } catch (err) {
            console.error("Login Error:", err);
            setFaillenMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        }
    }

    return (
        <div className="login-page-wrapper">
            <div className="back-button-container">
                <button className="back-icon" onClick={() => navigate(-1)} title="ย้อนกลับ">
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
            </div>

            <div className="login-card">
                <h2 className="login-title">ลงชื่อเข้าใช้</h2>

                <form className="login-form" onSubmit={submitLogin}>
                    {/* แสดง Banner สีแดงเมื่อ Login พลาด */}
                    {faillenmessage && (
                        <div className="error-banner">
                            <i className="fa-solid fa-circle-exclamation"></i> {faillenmessage}
                        </div>
                    )}

                    <div className="input-group">
                        <label>ชื่อบัญชีผู้ใช้</label>
                        <input
                            type="text"
                            placeholder="โปรดป้อนชื่อผู้ใช้"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label>รหัสผ่าน</label>
                        <input
                            type="password"
                            placeholder="โปรดป้อนรหัสผ่าน"
                            value={password}
                            onChange={(e) => setPassWord(e.target.value)}
                            required
                        />
                    </div>

                    <div className="helper-links">
                        <span onClick={() => navigate("/register")}>ต้องการสมัครบัญชี?</span>
                        <span onClick={() => navigate("/reset-password")}>ลืมรหัสผ่าน?</span>
                    </div>

                    <button className="btn-submit-login" type="submit">
                        เข้าสู่ระบบ
                    </button>
                </form>
            </div>
        </div>
    );
}