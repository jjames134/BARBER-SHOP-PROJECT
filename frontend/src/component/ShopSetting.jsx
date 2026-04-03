import { useNavigate } from "react-router-dom";
import { useContext, useState, useEffect } from "react";
import { DataContext } from "../DataContext";
import "./style/ShopSetting.css";
 
export default function ShopSetting() {
    const navigate = useNavigate();
    // ✅ FIX: ดึง baseURL จาก context ให้ถูกต้อง (เดิมดึง 2 ครั้งและไม่ได้ใช้ baseURL)
    const { baseURL, shopOpenTime, shopCloseTime, shopStatus } = useContext(DataContext);
 
    const [localOpenTime, setLocalOpenTime] = useState(shopOpenTime || "10:00");
    const [localCloseTime, setLocalCloseTime] = useState(shopCloseTime || "20:00");
    const [localShopStatus, setLocalShopStatus] = useState(shopStatus || "open");
 
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    // ✅ เพิ่ม error state แทน alert
    const [errorMsg, setErrorMsg] = useState("");
 
    // ✅ FIX: sync เมื่อ context เปลี่ยน
    useEffect(() => {
        if (shopOpenTime)  setLocalOpenTime(shopOpenTime);
        if (shopCloseTime) setLocalCloseTime(shopCloseTime);
        if (shopStatus)    setLocalShopStatus(shopStatus);
    }, [shopOpenTime, shopCloseTime, shopStatus]);
 
    const handleConfirmClick = () => {
        setPasswordInput("");
        setErrorMsg("");
        setShowPasswordModal(true);
    };
 
    const confirmPassword = async () => {
        if (!passwordInput.trim()) {
            setErrorMsg("กรุณากรอกรหัสผ่าน");
            return;
        }
 
        try {
            setLoading(true);
            setErrorMsg("");
 
            // ✅ Step 1: ตรวจสอบรหัสผ่านเจ้าของร้าน
            const verifyRes = await fetch(`${baseURL}/auth/verify_owner_password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                },
                body: JSON.stringify({ password: passwordInput })
            });
 
            if (!verifyRes.ok) {
                const err = await verifyRes.json().catch(() => ({}));
                throw new Error(err.detail || "รหัสผ่านไม่ถูกต้อง");
            }
 
            // ✅ Step 2: ตั้งค่าเวลาเปิด-ปิด
            // FIX: backend รับ query params ไม่ใช่ body json
            const openingParams = new URLSearchParams({
                open_time: localOpenTime + ":00",
                close_time: localCloseTime + ":00",
                is_open: localShopStatus === "open"
            });
 
            const openingRes = await fetch(`${baseURL}/queue_service/set_opening?${openingParams}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });
 
            if (!openingRes.ok) {
                const err = await openingRes.json().catch(() => ({}));
                throw new Error(err.detail || "ตั้งค่าเวลาไม่สำเร็จ");
            }
 
            // ✅ Step 3: เปิด/ปิดร้าน
            if (localShopStatus === "open") {
                const openRes = await fetch(`${baseURL}/queue_service/open_shop`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                // FIX: ไม่ throw ถ้า 400 (อาจสร้างคิวซ้ำ) แค่ log
                if (!openRes.ok) {
                    const err = await openRes.json().catch(() => ({}));
                    console.warn("open_shop warning:", err.detail);
                }
            } else {
                const closeRes = await fetch(`${baseURL}/queue_service/close_shop`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${localStorage.getItem("token")}`
                    }
                });
                if (!closeRes.ok) {
                    const err = await closeRes.json().catch(() => ({}));
                    console.warn("close_shop warning:", err.detail);
                }
            }
 
            setShowPasswordModal(false);
            navigate("/");
 
        } catch (e) {
            setErrorMsg(e.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        } finally {
            setLoading(false);
        }
    };
 
    // ✅ FIX: กด Enter ใน modal ได้เลย
    const handleModalKeyDown = (e) => {
        if (e.key === "Enter" && !loading) confirmPassword();
        if (e.key === "Escape") setShowPasswordModal(false);
    };
 
    const timeOptions = [
        "10:00","11:00","12:00","13:00","14:00",
        "15:00","16:00","17:00","18:00","19:00","20:00"
    ];
 
    return (
        <div className="ss-page">
            <button className="ss-back-btn" onClick={() => navigate("/")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
            </button>
 
            <div className="ss-card">
                {/* Header */}
                <div className="ss-card-header">
                    <h1 className="ss-title">จัดการร้าน</h1>
                    <p className="ss-subtitle">ตั้งค่าสถานะและเวลาให้บริการ</p>
                </div>
 
                <div className="ss-divider" />
 
                {/* Status Section */}
                <div className="ss-section">
                    <span className="ss-label">สถานะร้านปัจจุบัน</span>
                    <div className="ss-status-group">
                        <label className={`ss-status-opt ss-open ${localShopStatus === "open" ? "ss-active-open" : ""}`}>
                            <input
                                type="radio"
                                value="open"
                                checked={localShopStatus === "open"}
                                onChange={(e) => setLocalShopStatus(e.target.value)}
                            />
                            <div className="ss-status-icon ss-icon-open">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="5"/>
                                    <line x1="12" y1="1" x2="12" y2="3"/>
                                    <line x1="12" y1="21" x2="12" y2="23"/>
                                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                                    <line x1="1" y1="12" x2="3" y2="12"/>
                                    <line x1="21" y1="12" x2="23" y2="12"/>
                                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                                </svg>
                            </div>
                            <div className="ss-status-text">
                                <span className="ss-status-name">เปิดร้าน</span>
                                <span className="ss-status-desc">พร้อมรับลูกค้า</span>
                            </div>
                            <div className={`ss-check ${localShopStatus === "open" ? "ss-check-open" : ""}`}>
                                {localShopStatus === "open" && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                )}
                            </div>
                        </label>
 
                        <label className={`ss-status-opt ss-close ${localShopStatus === "close" ? "ss-active-close" : ""}`}>
                            <input
                                type="radio"
                                value="close"
                                checked={localShopStatus === "close"}
                                onChange={(e) => setLocalShopStatus(e.target.value)}
                            />
                            <div className="ss-status-icon ss-icon-close">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                                </svg>
                            </div>
                            <div className="ss-status-text">
                                <span className="ss-status-name">ปิดร้าน</span>
                                <span className="ss-status-desc">หยุดรับออร์เดอร์</span>
                            </div>
                            <div className={`ss-check ${localShopStatus === "close" ? "ss-check-close" : ""}`}>
                                {localShopStatus === "close" && (
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"/>
                                    </svg>
                                )}
                            </div>
                        </label>
                    </div>
                </div>
 
                {/* Time Section — แสดงเฉพาะตอนเปิดร้าน */}
                {localShopStatus === "open" && (
                    <div className="ss-section ss-fade-in">
                        <span className="ss-label">ช่วงเวลาให้บริการ</span>
                        <div className="ss-time-row">
                            <div className="ss-time-box">
                                <span className="ss-time-sub">เปิด</span>
                                <select
                                    value={localOpenTime}
                                    onChange={(e) => setLocalOpenTime(e.target.value)}
                                >
                                    {timeOptions.map(t => (
                                        <option key={t} value={t}>{t} น.</option>
                                    ))}
                                </select>
                            </div>
                            <span className="ss-time-sep">—</span>
                            <div className="ss-time-box">
                                <span className="ss-time-sub">ปิด</span>
                                <select
                                    value={localCloseTime}
                                    onChange={(e) => setLocalCloseTime(e.target.value)}
                                >
                                    {timeOptions.map(t => (
                                        // ✅ FIX: เปรียบเทียบเวลาถูกต้อง
                                        <option key={t} value={t} disabled={t <= localOpenTime}>
                                            {t} น.
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* ✅ เพิ่ม: แสดง duration ที่เลือก */}
                        <p className="ss-time-hint">
                            ระยะเวลาเปิด {
                                (() => {
                                    const [oh, om] = localOpenTime.split(":").map(Number);
                                    const [ch, cm] = localCloseTime.split(":").map(Number);
                                    const diff = (ch * 60 + cm) - (oh * 60 + om);
                                    return diff > 0 ? `${diff / 60} ชั่วโมง` : "—";
                                })()
                            }
                        </p>
                    </div>
                )}
 
                {/* Actions */}
                <div className="ss-footer">
                    <button className="ss-btn-cancel" onClick={() => navigate("/")}>
                        ยกเลิก
                    </button>
                    <button className="ss-btn-confirm" onClick={handleConfirmClick}>
                        บันทึกการตั้งค่า
                    </button>
                </div>
            </div>
 
            {/* ─── Password Modal ─────────────────────── */}
            {showPasswordModal && (
                <div className="ss-modal-overlay" onClick={() => setShowPasswordModal(false)}>
                    <div className="ss-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleModalKeyDown}>
                        <div className="ss-modal-icon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                                stroke="#8B6020" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2"/>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                            </svg>
                        </div>
                        <h3 className="ss-modal-title">ยืนยันสิทธิ์เจ้าของร้าน</h3>
                        <p className="ss-modal-sub">กรุณากรอกรหัสผ่านเพื่อบันทึกการตั้งค่า</p>
 
                        <div className="ss-pw-wrap">
                            <input
                                className="ss-pw-input"
                                type={showPassword ? "text" : "password"}
                                placeholder="รหัสผ่านของคุณ"
                                value={passwordInput}
                                onChange={(e) => { setPasswordInput(e.target.value); setErrorMsg(""); }}
                                autoFocus
                            />
                            <button
                                type="button"
                                className="ss-pw-eye"
                                onClick={() => setShowPassword(p => !p)}
                                tabIndex={-1}
                            >
                                {showPassword ? (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                )}
                            </button>
                        </div>
 
                        {/* ✅ แสดง error ใน modal แทน alert */}
                        {errorMsg && <p className="ss-error-msg">{errorMsg}</p>}
 
                        <div className="ss-modal-actions">
                            <button
                                className="ss-m-cancel"
                                onClick={() => setShowPasswordModal(false)}
                                disabled={loading}
                            >
                                ยกเลิก
                            </button>
                            <button
                                className="ss-m-confirm"
                                onClick={confirmPassword}
                                disabled={loading || !passwordInput.trim()}
                            >
                                {loading ? (
                                    <span className="ss-spinner-row">
                                        <span className="ss-spinner" /> กำลังตรวจสอบ...
                                    </span>
                                ) : "ยืนยัน"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}