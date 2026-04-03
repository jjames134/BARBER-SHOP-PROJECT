import { useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useMemo } from "react";
import { DataContext } from "../DataContext";
import "./style/ShopSetting.css";

export default function ShopSetting() {
    const navigate = useNavigate();
    const { baseURL, shopOpenTime, shopCloseTime, shopStatus, fetchShopData } = useContext(DataContext);

    // --- Local States ---
    const [localOpenTime, setLocalOpenTime] = useState("10:00");
    const [localCloseTime, setLocalCloseTime] = useState("15:00");
    const [localShopStatus, setLocalShopStatus] = useState("close");
    
    // ตัวแปรสำคัญ: ป้องกันค่าเด้งกลับตอน Context อัปเดตช้า
    const [isDirty, setIsDirty] = useState(false); 

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordInput, setPasswordInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // --- Generate Time Options (00:00 - 23:00) ---
    const timeOptions = useMemo(() => Array.from({ length: 24 }, (_, i) => {
        const hour = i < 10 ? `0${i}` : `${i}`;
        return `${hour}:00`;
    }), []);

    // --- Sync Data จาก Context (เฉพาะตอนโหลดหน้าแรก หรือเมื่อยังไม่ได้เริ่มแก้เอง) ---
    useEffect(() => {
        if (!isDirty) {
            if (shopOpenTime) setLocalOpenTime(shopOpenTime.substring(0, 5));
            if (shopCloseTime) setLocalCloseTime(shopCloseTime.substring(0, 5));
            
            // แนะนำสถานะเบื้องต้นตามเวลาปัจจุบัน (Logic เดียวกับที่คุณต้องการ)
            const now = new Date();
            const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const openStr = shopOpenTime ? shopOpenTime.substring(0, 5) : "10:00";
            const closeStr = shopCloseTime ? shopCloseTime.substring(0, 5) : "15:00";

            if (shopStatus === "open") {
                if (currentTimeStr < openStr || currentTimeStr >= closeStr) {
                    setLocalShopStatus("close");
                } else {
                    setLocalShopStatus("open");
                }
            } else {
                setLocalShopStatus("close");
            }
        }
    }, [shopOpenTime, shopCloseTime, shopStatus, isDirty]);

    // --- Event Handlers ---
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

    setLoading(true);
    setErrorMsg("");

    try {
        const token = localStorage.getItem("token");

        // 1. Verify Password
        const verifyRes = await fetch(`${baseURL}/auth/verify_owner_password`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ password: passwordInput })
        });

        if (!verifyRes.ok) throw new Error("รหัสผ่านไม่ถูกต้อง");

        // 2. Set Opening (บันทึกเวลา)
        const openingParams = new URLSearchParams({
            open_time: `${localOpenTime}:00`,
            close_time: `${localCloseTime}:00`,
            is_open: localShopStatus === "open"
        });

        const setRes = await fetch(`${baseURL}/queue_service/set_opening?${openingParams}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (!setRes.ok) throw new Error("บันทึกเวลาไม่สำเร็จ");

        // 3. Action: Open/Close Shop
        const endpoint = localShopStatus === "open" ? "open_shop" : "close_shop";
        const actionRes = await fetch(`${baseURL}/queue_service/${endpoint}`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (actionRes.ok) {
            alert("บันทึกการตั้งค่าสำเร็จ!");
            
            // ปลดล็อกเพื่อให้ useEffect กลับมาใช้ค่าจาก Context ได้
            setIsDirty(false);
            setShowPasswordModal(false);
            
            // ดึงข้อมูลใหม่จาก Context
            await fetchShopData();

        } else {
            throw new Error("ระบบบันทึกเวลาแล้ว แต่ไม่สามารถจัดการคิวได้");
        }

    } catch (e) {
        setErrorMsg(e.message);
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="ss-page">
            <button className="ss-back-btn" onClick={() => navigate("/")}>←</button>

            <div className="ss-card">
                <div className="ss-card-header">
                    <h1 className="ss-title">จัดการร้าน</h1>
                    <p className="ss-subtitle">
                        สถานะปัจจุบัน: 
                        <span className={`ss-badge ${shopStatus === 'open' ? 'active' : 'inactive'}`}>
                            {shopStatus === 'open' ? ' เปิด' : ' ปิด'}
                        </span>
                    </p>
                </div>

                <div className="ss-section">
                    <span className="ss-label">เลือกสถานะที่ต้องการเปลี่ยน</span>
                    <div className="ss-status-group">
                        <label className={`ss-status-opt ss-open ${localShopStatus === "open" ? "ss-active-open" : ""}`}>
                            <input 
                                type="radio" 
                                value="open" 
                                checked={localShopStatus === "open"} 
                                onChange={(e) => { setLocalShopStatus(e.target.value); setIsDirty(true); }} 
                            />
                            <div className="ss-status-text">
                                <span className="ss-status-name">เปิดร้าน</span>
                                <span className="ss-status-desc">รับคิวตามเวลาที่ระบุ</span>
                            </div>
                        </label>

                        <label className={`ss-status-opt ss-close ${localShopStatus === "close" ? "ss-active-close" : ""}`}>
                            <input 
                                type="radio" 
                                value="close" 
                                checked={localShopStatus === "close"} 
                                onChange={(e) => { setLocalShopStatus(e.target.value); setIsDirty(true); }} 
                            />
                            <div className="ss-status-text">
                                <span className="ss-status-name">ปิดร้าน</span>
                                <span className="ss-status-desc">หยุดรับคิว/ล้างสล็อตว่าง</span>
                            </div>
                        </label>
                    </div>
                </div>

                {localShopStatus === "open" && (
                    <div className="ss-section ss-fade-in">
                        <span className="ss-label">กำหนดเวลาเปิด-ปิด (Default 10:00 - 15:00)</span>
                        <div className="ss-time-row">
                            <div className="ss-time-box">
                                <span className="ss-time-sub">เปิด</span>
                                <select value={localOpenTime} onChange={(e) => { setLocalOpenTime(e.target.value); setIsDirty(true); }}>
                                    {timeOptions.map(t => <option key={t} value={t}>{t} น.</option>)}
                                </select>
                            </div>
                            <span className="ss-time-sep">—</span>
                            <div className="ss-time-box">
                                <span className="ss-time-sub">ปิด</span>
                                <select value={localCloseTime} onChange={(e) => { setLocalCloseTime(e.target.value); setIsDirty(true); }}>
                                    {timeOptions.map(t => (
                                        <option key={t} value={t} disabled={t <= localOpenTime}>{t} น.</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="ss-footer">
                    <button className="ss-btn-cancel" onClick={() => navigate("/")}>ยกเลิก</button>
                    <button className="ss-btn-confirm" onClick={handleConfirmClick}>บันทึกข้อมูล</button>
                </div>
            </div>

            {showPasswordModal && (
                <div className="ss-modal-overlay">
                    <div className="ss-modal">
                        <h3>ยืนยันรหัสผ่านเจ้าของร้าน</h3>
                        <input
                            className="ss-pw-input"
                            type="password"
                            placeholder="รหัสผ่าน"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && confirmPassword()}
                            autoFocus
                        />
                        {errorMsg && <p className="ss-error-msg">{errorMsg}</p>}
                        <div className="ss-modal-actions">
                            <button onClick={() => setShowPasswordModal(false)} disabled={loading}>ยกเลิก</button>
                            <button className="ss-m-confirm" onClick={confirmPassword} disabled={loading}>
                                {loading ? "กำลังบันทึก..." : "ยืนยัน"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}