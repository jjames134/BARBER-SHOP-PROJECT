import { useNavigate } from "react-router-dom"
import { useState, useRef, useContext } from "react"
import { DataContext } from "../DataContext"
import { jwtDecode } from "jwt-decode";
import "./style/LoginPage.css"

export default function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassWord] = useState('');
    const [faillenmessage, setFaillenMessage] = useState("");
    const { setRole, setIsLogin } = useContext(DataContext);

    // ✅ ต้องก๊อปฟังก์ชันนี้มาวางไว้ข้างใน Login() ด้วยครับ
    async function submitLogin(e) {
        e.preventDefault();
        if (!username || !password) {
            setFaillenMessage("กรุณากรอก username และ password ให้ครบถ้วน");
            return;
        }

        try {
            const res = await fetch("http://localhost:8000/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                const decoded = jwtDecode(data.access_token); // 2. Decode token เพื่อเอา data
                const userRole = decoded.role; // ดึง role ออกมา (เช่น "CUSTOMER", "OWNER")

                localStorage.setItem("token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token); // เก็บไว้ใช้ตอน token หมดอายุ

                setRole(userRole); // 3. อัปเดต Context ด้วยค่าจริง
                setIsLogin(true);
                navigate("/");
            } else {
                setFaillenMessage(data.detail || "Login Failed");
            }
        } catch (err) {
            setFaillenMessage("Server Connection Failed");
        }
    }

    return (
        <div className="login-page-wrapper">
            <div className="back-button-container">
                <button className="back-icon" onClick={() => navigate(-1)}>
                    {/* ถ้า font-awesome ไม่ขึ้น ให้ใช้ตัวหนังสือ < แทนไปก่อนได้ครับ */}
                    <i className="fa-solid fa-arrow-left"></i>
                </button>
            </div>

            <div className="login-card">
                <h2 className="login-title">ลงชื่อเข้าใช้</h2>

                <form className="login-form" onSubmit={submitLogin}>

                    {faillenmessage && <div className="error-banner">{faillenmessage}</div>}

                    <div className="input-group">
                        <label>ชื่อบัญชีผู้ใช้</label>
                        <input
                            type="text"
                            placeholder="โปรดป้อนชื่อผู้ใช้"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label>รหัสผ่าน</label>
                        <input
                            type="password"
                            placeholder="โปรดป้อนรหัสผ่าน"
                            value={password}
                            onChange={(e) => setPassWord(e.target.value)}
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