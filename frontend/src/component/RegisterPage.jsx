import { useNavigate } from "react-router-dom"
import { useState, useContext, useEffect } from "react"
import { DataContext } from "../DataContext"
import "./style/RegisterPage.css"

export default function RegisterPage() {
    const navigate = useNavigate();
    const { baseURL } = useContext(DataContext);

    const [isOtpPopup, setIsOtpPopup] = useState(false);
    const [formData, setFormData] = useState({
        username: "", password: "", passcheck: "",
        firstname: "", lastname: "", email: "", phone: ""
    });

    const [otp, setOtp] = useState("");
    const [timer, setTimer] = useState(300);
    const [error, setError] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [shake, setShake] = useState(false);

    // ⏱ timer
    useEffect(() => {
        let interval;
        if (isOtpPopup && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isOtpPopup, timer]);

    const formatTime = () => {
        const m = Math.floor(timer / 60);
        const s = timer % 60;
        return `${m}:${s < 10 ? `0${s}` : s}`;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🔥 สมัคร
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();

        // ✅ password length
        if (formData.password.length < 8) {
            setError("❌ รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        // ✅ password match
        if (formData.password !== formData.passcheck) {
            setError("❌ รหัสผ่านไม่ตรงกัน กรุณาตรวจสอบอีกครั้ง");
            setShake(true);
            setTimeout(() => setShake(false), 500);
            return;
        }

        try {
            const res = await fetch(`${baseURL}/auth/pre_register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error();

            setError("");
            setTimer(300);
            setIsOtpPopup(true);

        } catch {
            setError("❌ สมัครไม่สำเร็จ (อีเมลอาจซ้ำ)");
        }
    };

    // 🔥 OTP verify
    const handleVerifyOtp = async () => {
        try {
            // 1️⃣ verify OTP
            const res = await fetch(`${baseURL}/auth/verify_OTP`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: otp,
                    purpose: "REGISTER"
                })
            });

            if (!res.ok) throw new Error();

            // 2️⃣ 🔥 REGISTER จริง
            const registerRes = await fetch(`${baseURL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: formData.email,
                    otp: otp
                })
            });

            if (!registerRes.ok) throw new Error();

            alert("สมัครสมาชิกสำเร็จ 🎉");
            navigate("/login");

        } catch {
            setShowToast(true);
            setShake(true);

            setTimeout(() => {
                setShowToast(false);
                setShake(false);
            }, 3000);
        }
    };

    return (
        <div className="register-main-layout">

            <div className={`register-card-container ${shake && !isOtpPopup ? "shake" : ""}`}>

                <div className="register-header-section">
                    <h2 className="register-main-title">สร้างบัญชีผู้ใช้</h2>
                </div>

                {error && <div className="error-alert-box">{error}</div>}

                <form onSubmit={handleRegisterSubmit} className="register-form-body">

                    <div className="input-row-flex">
                        <div className="input-field-group">
                            <label>ชื่อ</label>
                            <input name="firstname" onChange={handleChange} required />
                        </div>
                        <div className="input-field-group">
                            <label>นามสกุล</label>
                            <input name="lastname" onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="input-field-group">
                        <label>ชื่อบัญชีผู้ใช้</label>
                        <input name="username" onChange={handleChange} required />
                    </div>

                    <div className="input-field-group">
                        <label>หมายเลขโทรศัพท์</label>
                        <input name="phone" onChange={handleChange} required />
                    </div>

                    <div className="input-field-group">
                        <label>อีเมล</label>
                        <input type="email" name="email" onChange={handleChange} required />
                    </div>

                    <div className="input-field-group">
                        <label>รหัสผ่าน</label>
                        <input
                            type="password"
                            name="password"
                            minLength="8"
                            className={formData.password.length > 0 && formData.password.length < 8 ? "input-error" : ""}
                            placeholder="อย่างน้อย 8 ตัว"
                            onChange={handleChange}
                            required
                        />
                        {formData.password.length > 0 && formData.password.length < 8 && (
                            <small className="input-helper">ต้องมีอย่างน้อย 8 ตัวอักษร</small>
                        )}
                    </div>

                    <div className="input-field-group">
                        <label>ยืนยันรหัสผ่าน</label>
                        <input
                            type="password"
                            name="passcheck"
                            className={formData.passcheck && formData.passcheck !== formData.password ? "input-error" : ""}
                            onChange={handleChange}
                            required
                        />
                        {formData.passcheck && formData.passcheck !== formData.password && (
                            <small className="input-helper">รหัสผ่านไม่ตรงกัน</small>
                        )}
                    </div>

                    <div className="form-footer-action">
                        <div className="center-button-wrapper">
                            <button type="submit" className="barber-btn-orange">
                                สร้างบัญชีผู้ใช้
                            </button>
                        </div>

                        <p className="login-nav-text">
                            มีบัญชีแล้ว?{" "}
                            <span onClick={() => navigate("/login")} className="login-link-span">
                                เข้าสู่ระบบ
                            </span>
                        </p>
                    </div>

                </form>
            </div>

            {/* OTP */}
            {isOtpPopup && (
                <div className="otp-overlay-dark">
                    <div className={`otp-modal-box ${shake ? "shake" : ""}`}>
                        <h2 className="otp-modal-title">ยืนยันรหัส OTP</h2>

                        <p className="otp-modal-desc">
                            ส่งไปที่ <b>{formData.email}</b><br />
                            <span className={`otp-timer ${timer < 60 ? "urgent" : ""}`}>
                                {formatTime()}
                            </span>
                        </p>

                        <input
                            className="otp-dashed-input"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                        />

                        <div className="center-button-wrapper">
                            <button
                                className="barber-btn-orange"
                                onClick={handleVerifyOtp}
                                disabled={timer === 0}
                            >
                                ยืนยันรหัส
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showToast && (
                <div className="top-toast-notification">
                    <div className="toast-card">
                        ⚠️ OTP ไม่ถูกต้อง
                    </div>
                </div>
            )}
        </div>
    );
}