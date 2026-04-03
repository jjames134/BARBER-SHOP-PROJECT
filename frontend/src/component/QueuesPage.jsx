import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useContext, useCallback } from "react";
import { DataContext } from "../DataContext";
import { FiClock, FiCheck, FiChevronLeft, FiInfo, FiZap, FiAlertCircle } from "react-icons/fi";
import "./style/QueuesPage.css";

export default function QueuesPage() {
    const { chairId } = useParams();
    const navigate = useNavigate();
    const { user, baseURL } = useContext(DataContext); 
    
    const [queues, setQueues] = useState([]);
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [bookingRef, setBookingRef] = useState("");
    const [loading, setLoading] = useState(true);

    // ดึงข้อมูลคิว (Backend จะคำนวณ NO_SHOW มาให้แล้ว)
    const fetchQueues = useCallback(async () => {
        try {
            const res = await fetch(`${baseURL}/queue_service/queues?chair_id=${chairId}`);
            if (res.ok) {
                const data = await res.json();
                setQueues(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [baseURL, chairId]);

    useEffect(() => {
        fetchQueues();
        const interval = setInterval(fetchQueues, 30000); // Auto-refresh ทุก 30 วิ
        return () => clearInterval(interval);
    }, [fetchQueues]);

    const handleBookingClick = (queue) => {
        if (!user) {
            alert("กรุณาเข้าสู่ระบบก่อนทำการจองคิว");
            navigate("/login");
            return;
        }
        if (user.rolestatus !== "CUSTOMER") {
            alert("เฉพาะลูกค้าเท่านั้นที่สามารถจองคิวได้");
            return;
        }
        setSelectedQueue(queue);
        setShowConfirm(true);
    };

    const confirmBooking = async () => {
        try {
            const res = await fetch(`${baseURL}/queue_service/user/${chairId}/queues/${selectedQueue.id}/booked`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("token")}`
                }
            });

            if (res.ok) {
                const result = await res.json();
                setBookingRef(`Q-${result.id}`); 
                setShowConfirm(false);
                setShowSuccess(true);
                fetchQueues();
            } else {
                const errData = await res.json();
                alert(errData.detail || "การจองล้มเหลว");
            }
        } catch (err) {
            alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
        }
    };

    if (loading) return <div className="pq-loader">กำลังโหลดตารางเวลา...</div>;

    return (
        <div className="pq-main-bg">
            <header className="pq-glass-header">
                <button className="pq-back-btn" onClick={() => navigate(-1)}><FiChevronLeft size={24} /></button>
                <div className="pq-title-wrapper">
                    <h1>เลือกช่วงเวลา</h1>
                    <p>เก้าอี้บริการ #{chairId} • วันนี้</p>
                </div>
            </header>

            <div className="pq-timeline-container">
                {queues.map((q) => {
                    const isMine = user && q.customer_id === user.id;
                    const status = q.status;

                    return (
                        <div key={q.id} className={`pq-time-card st-${status.toLowerCase()} ${isMine ? 'is-mine animate-pulse' : ''}`}>
                            <div className="pq-time-side">
                                <span className="pq-start">{q.start_time.substring(0, 5)}</span>
                                <div className="pq-line"></div>
                                <span className="pq-end">{q.end_time.substring(0, 5)}</span>
                            </div>

                            <div className="pq-content-side">
                                {isMine ? (
                                    <div className="pq-mine-info">
                                        <div className="pq-badge-mine"><FiCheck /> คิวของคุณ</div>
                                        <p>คุณมีนัดหมายเวลานี้</p>
                                    </div>
                                ) : status === "AVAILABLE" ? (
                                    <div className="pq-avail-info">
                                        <span className="pq-label-avail">ว่าง</span>
                                        <button className="pq-btn-select" onClick={() => handleBookingClick(q)}>
                                            <FiZap /> จองเลย
                                        </button>
                                    </div>
                                ) : (
                                    <span className={`pq-status-tag ${status.toLowerCase()}`}>
                                        {status === "BOOKED" ? "มีผู้จองแล้ว" : status === "NO_SHOW" ? "หมดเวลา" : status}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal ยืนยันการจอง */}
            {showConfirm && (
                <div className="pq-modal-overlay">
                    <div className="pq-modal-card">
                        <FiAlertCircle size={40} color="#3b82f6" />
                        <h2>ยืนยันนัดหมาย?</h2>
                        <p>เวลา <strong>{selectedQueue?.start_time} น.</strong></p>
                        <div className="pq-modal-btns">
                            <button className="pq-btn-no" onClick={() => setShowConfirm(false)}>ยกเลิก</button>
                            <button className="pq-btn-yes" onClick={confirmBooking}>ยืนยัน</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal สำเร็จ */}
            {showSuccess && (
                <div className="pq-modal-overlay">
                    <div className="pq-modal-card pq-success">
                        <div className="pq-success-icon">✓</div>
                        <h2>จองสำเร็จ!</h2>
                        <p>รหัสคิว: {bookingRef}</p>
                        <button className="pq-btn-finish" onClick={() => navigate("/booked-table")}>ดูคิวของฉัน</button>
                    </div>
                </div>
            )}
        </div>
    );
}