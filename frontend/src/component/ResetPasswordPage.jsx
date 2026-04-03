import { useNavigate } from "react-router-dom"
import { useState, useEffect, useContext } from "react"
import { DataContext } from "../DataContext"
import "./style/ResetPasswordPage.css"

export default function ResetPassword() {
    const navigate = useNavigate()
    const { baseURL } = useContext(DataContext)

    const [step, setStep] = useState(1)
    const [isOtpPopup, setIsOtpPopup] = useState(false)
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [showToast, setShowToast] = useState(false)
    const [toastMsg, setToastMsg] = useState("")
    const [shake, setShake] = useState(false)
    const [timer, setTimer] = useState(300)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        let interval
        if (isOtpPopup && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000)
        }
        return () => clearInterval(interval)
    }, [isOtpPopup, timer])

    const formatTime = () => {
        const m = Math.floor(timer / 60)
        const s = timer % 60
        return `${m}:${s < 10 ? `0${s}` : s}`
    }

    const showError = (msg) => {
        setToastMsg(msg)
        setShowToast(true)
        setShake(true)
        setTimeout(() => { setShowToast(false); setShake(false) }, 3000)
    }

    // ✅ ส่ง OTP ผ่าน API POST /auth/send_OTP
    const handleRequestOTP = async (e) => {
        e.preventDefault()
        if (!email) { setError("กรุณากรอก Email"); return }
        setLoading(true)
        setError("")
        try {
            const res = await fetch(
                `${baseURL}/auth/send_OTP?email=${encodeURIComponent(email)}&purpose=RESET_PASSWORD`,
                { method: "POST" }
            )
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "ส่ง OTP ไม่สำเร็จ")
            }
            setTimer(300)
            setIsOtpPopup(true)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    // ✅ ยืนยัน OTP ผ่าน API POST /auth/verify_OTP
    const handleVerifyOtp = async () => {
        if (!otp) return
        setLoading(true)
        try {
            const res = await fetch(`${baseURL}/auth/verify_OTP`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, purpose: "RESET_PASSWORD" })
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                showError(err.detail || "OTP ไม่ถูกต้อง")
                return
            }
            setIsOtpPopup(false)
            setStep(2)
        } catch {
            showError("เกิดข้อผิดพลาด")
        } finally {
            setLoading(false)
        }
    }

    // ✅ รีเซ็ตรหัสผ่าน — backend ใช้ endpoint /auth/reset_password (ต้องสร้างหรือปรับ)
    // หรือใช้ change_password ถ้า user login อยู่
    // ที่นี่ใช้ pre_register flow: หลัง verify OTP แล้ว ให้ส่ง new_password
    const handleResetPassword = async () => {
        if (newPassword.length < 8) {
            setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
            setShake(true)
            setTimeout(() => setShake(false), 500)
            return
        }
        if (newPassword !== confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน")
            setShake(true)
            setTimeout(() => setShake(false), 500)
            return
        }
        setLoading(true)
        setError("")
        try {
            // ✅ POST /auth/reset_password (endpoint นี้ต้องมีใน backend)
            const res = await fetch(`${baseURL}/auth/reset_password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    new_password: newPassword
                })
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.detail || "เปลี่ยนรหัสผ่านไม่สำเร็จ")
            }
            setToastMsg("เปลี่ยนรหัสผ่านสำเร็จ!")
            setShowToast(true)
            setTimeout(() => navigate("/login"), 1500)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    // ✅ ขอ OTP ใหม่
    const resendOTP = async () => {
        setLoading(true)
        try {
            await fetch(
                `${baseURL}/auth/send_OTP?email=${encodeURIComponent(email)}&purpose=RESET_PASSWORD`,
                { method: "POST" }
            )
            setTimer(300)
        } catch { /* silent */ } finally {
            setLoading(false)
        }
    }

    return (
        <div className="reset-password-layout">
            <button className="back-arrow-btn" onClick={() => navigate("/login")}>←</button>

            <div className={`reset-card-box ${shake && step === 2 ? "shake" : ""}`}>
                <h2 className="reset-card-title">
                    {step === 1 ? "ลืมรหัสผ่าน" : "ตั้งรหัสผ่านใหม่"}
                </h2>

                {/* STEP 1 */}
                {step === 1 && (
                    <form onSubmit={handleRequestOTP}>
                        {error && <div className="error-alert-box">{error}</div>}
                        <div className="input-field-wrapper">
                            <label>Email</label>
                            <input
                                type="email"
                                className="barber-input-style"
                                placeholder="กรอก Email ที่ลงทะเบียนไว้"
                                value={email}
                                onChange={e => { setEmail(e.target.value); setError("") }}
                                required
                            />
                        </div>
                        <div className="center-button-wrapper">
                            <button type="submit" className="barber-btn-orange" disabled={loading}>
                                {loading ? "กำลังส่ง..." : "ขอรหัส OTP"}
                            </button>
                        </div>
                    </form>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <form onSubmit={e => { e.preventDefault(); handleResetPassword() }}>
                        {error && <div className="error-alert-box">{error}</div>}
                        <div className="input-field-wrapper">
                            <label>รหัสผ่านใหม่</label>
                            <input
                                type="password"
                                className="barber-input-style"
                                placeholder="อย่างน้อย 8 ตัวอักษร"
                                onChange={e => { setNewPassword(e.target.value); setError("") }}
                                required
                                minLength={8}
                            />
                        </div>
                        <div className="input-field-wrapper">
                            <label>ยืนยันรหัสผ่าน</label>
                            <input
                                type="password"
                                className="barber-input-style"
                                placeholder="ยืนยันรหัสผ่านใหม่"
                                onChange={e => { setConfirmPassword(e.target.value); setError("") }}
                                required
                            />
                        </div>
                        <div className="center-button-wrapper">
                            <button type="submit" className="barber-btn-orange" disabled={loading}>
                                {loading ? "กำลังบันทึก..." : "ยืนยันการเปลี่ยนรหัส"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* OTP Popup */}
            {isOtpPopup && (
                <div className="otp-overlay-dark">
                    <div className={`otp-modal-box ${shake ? "shake" : ""}`}>
                        <h2 className="otp-modal-title">ยืนยันรหัส OTP</h2>
                        <p className="otp-modal-desc">
                            รหัสถูกส่งไปที่ <b>{email}</b><br />
                            หมดอายุใน{" "}
                            <span className={`otp-timer ${timer < 60 ? "urgent" : ""}`}>{formatTime()}</span>
                        </p>
                        <input
                            className="otp-dashed-input"
                            maxLength="6"
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                            placeholder="- - - - - -"
                        />
                        <div className="center-button-wrapper">
                            <button
                                className="barber-btn-orange"
                                onClick={handleVerifyOtp}
                                disabled={timer === 0 || loading || otp.length < 6}
                            >
                                {loading ? "กำลังตรวจสอบ..." : "ยืนยันรหัส"}
                            </button>
                        </div>
                        <div className="otp-modal-footer">
                            <button className="otp-link" onClick={() => setIsOtpPopup(false)}>ยกเลิก</button>
                            <button
                                className="otp-link"
                                disabled={timer > 0 || loading}
                                onClick={resendOTP}
                            >
                                {timer > 0 ? `ส่งใหม่ (${formatTime()})` : "ส่งใหม่"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {showToast && (
                <div className="top-toast-notification">
                    <div className="toast-card">
                        <span className="toast-icon">{toastMsg.includes("สำเร็จ") ? "✅" : "⚠️"}</span>
                        <span>{toastMsg}</span>
                    </div>
                </div>
            )}
        </div>
    )
}