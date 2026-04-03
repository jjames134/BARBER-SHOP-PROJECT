import { useState, useEffect, useContext, useCallback } from "react";
import { DataContext } from "../DataContext";
import "./style/WorkingTablePage.css";

const STATUS_META = {
    AVAILABLE: { label: "ว่าง", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)", dot: "#22c55e" },
    BOOKED:    { label: "จองออนไลน์", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)", dot: "#3b82f6" },
    CHECKIN:   { label: "กำลังบริการ", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)", dot: "#f59e0b" },
    COMPLETE:  { label: "เสร็จสิ้น", color: "#a855f7", bg: "rgba(168, 85, 247, 0.1)", dot: "#a855f7" },
    NO_SHOW:   { label: "ไม่มา/ปิดคิว", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)", dot: "#94a3b8" },
};

export default function WorkTablePage() {
    const { baseURL, fetchWithAuth, userData } = useContext(DataContext);
    const [workData, setWorkData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // 1. ฟังก์ชันดึงข้อมูลตารางงาน (เช็คสถานะร้าน + คิวของช่าง)
    const fetchMyTable = useCallback(async () => {
        try {
            const res = await fetchWithAuth(`${baseURL}/queue_service/my-work-table`);
            if (res.ok) {
                const data = await res.json();
                setWorkData(data);
                setError(null);
            } else {
                const errData = await res.json();
                setError(errData.detail || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
            }
        } catch (err) {
            setError("เชื่อมต่อเซิร์ฟเวอร์ล้มเหลว");
        } finally {
            setLoading(false);
        }
    }, [baseURL, fetchWithAuth]);

    useEffect(() => {
        fetchMyTable();
        const timer = setInterval(fetchMyTable, 60000); // Auto-refresh ทุก 1 นาที
        return () => clearInterval(timer);
    }, [fetchMyTable]);

    // 2. ฟังก์ชันจัดการ Action (Walk-in, Check-in, Complete, Cancel)
    const handleAction = async (qId, actionType, chairId) => {
        if (actionType === "cancel" && !window.confirm("ยืนยันการยกเลิกคิวนี้?")) return;
        
        setActionLoading(true);
        // ถ้าเป็น cancel เราจะยิงไปที่ endpoint cancel-action ที่เราสร้างไว้ใน backend
        const endpoint = actionType === "cancel" ? "cancel-action" : actionType;
        
        try {
            const res = await fetchWithAuth(`${baseURL}/queue_service/chairs/${chairId}/queues/${qId}/${endpoint}`, {
                method: "POST"
            });
            if (res.ok) {
                await fetchMyTable();
            } else {
                const err = await res.json();
                alert(err.detail || "ดำเนินการไม่สำเร็จ");
            }
        } catch (err) {
            alert("ผิดพลาดทางการเชื่อมต่อ");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="wt-loader-container">กำลังตรวจสอบข้อมูลร้าน...</div>;
    if (error) return <div className="wt-loader-container wt-error">⚠️ {error}</div>;

    // --- ตรวจสอบวันหยุดร้าน ---
    if (workData && !workData.is_shop_open) {
        return (
            <div className="wt-closed-page">
                <div className="closed-content">
                    <div className="closed-icon">📅</div>
                    <h1>วันนี้ร้านหยุดให้บริการ</h1>
                    <p>{workData.message || "ขออภัยในความไม่สะดวก"}</p>
                    <button className="btn-refresh" onClick={() => window.location.reload()}>ลองตรวจสอบอีกครั้ง</button>
                </div>
            </div>
        );
    }

    return (
        <div className="wt-page-container">
            <header className="wt-top-bar">
                <div className="barber-identity">
                    <img src={`${baseURL}/${userData?.profile_img}`} alt="barber" className="barber-pic" />
                    <div>
                        <h2>แผงควบคุม: {workData?.chair_name}</h2>
                        <p>ช่างผู้ดูแล: <strong>{userData?.firstname} {userData?.lastname}</strong></p>
                    </div>
                </div>
            </header>

            <div className="wt-work-grid">
                {workData?.queues.length === 0 ? (
                    <div className="no-data-msg">ไม่มีข้อมูลคิวสำหรับวันนี้</div>
                ) : (
                    workData.queues.map((q) => {
                        const meta = STATUS_META[q.status] || STATUS_META.NO_SHOW;
                        return (
                            <div key={q.id} className="wt-queue-card" style={{ borderTop: `5px solid ${meta.color}` }}>
                                <div className="card-header">
                                    <span className="time-range">{q.start_time} - {q.end_time}</span>
                                    <span className="status-label" style={{ color: meta.color, backgroundColor: meta.bg }}>
                                        {meta.label}
                                    </span>
                                </div>

                                <div className="card-body">
                                    <small>ชื่อลูกค้า</small>
                                    <h3>{q.customer_name}</h3>
                                </div>

                                <div className="card-footer">
                                    {/* สถานะ ว่าง */}
                                    {q.status === "AVAILABLE" && (
                                        <button className="btn-wt walkin" onClick={() => handleAction(q.id, "walkin", q.chair_id)} disabled={actionLoading}>
                                            จอง Walk-in
                                        </button>
                                    )}

                                    {/* สถานะ จองแล้ว (เพิ่มปุ่มยกเลิก) */}
                                    {q.status === "BOOKED" && (
                                        <>
                                            <button className="btn-wt checkin" onClick={() => handleAction(q.id, "checkin", q.chair_id)} disabled={actionLoading}>
                                                เช็คอิน
                                            </button>
                                            <button className="btn-wt cancel" onClick={() => handleAction(q.id, "cancel", q.chair_id)} disabled={actionLoading}>
                                                ยกเลิก
                                            </button>
                                        </>
                                    )}

                                    {/* สถานะ กำลังตัด */}
                                    {q.status === "CHECKIN" && (
                                        <button className="btn-wt complete" onClick={() => handleAction(q.id, "complete", q.chair_id)} disabled={actionLoading}>
                                            เสร็จสิ้นบริการ
                                        </button>
                                    )}

                                    {/* สถานะ No-show หรือ Complete (ปุ่มสำหรับเปิดคิวใหม่) */}
                                    {(q.status === "NO_SHOW" || q.status === "COMPLETE") && (
                                        <button className="btn-wt reset" onClick={() => handleAction(q.id, "cancel", q.chair_id)} disabled={actionLoading}>
                                            คืนสล็อตว่าง (Reset)
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}