import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useContext, useCallback } from "react";
import { DataContext } from "../DataContext";
import { FiClock, FiCheck, FiChevronLeft, FiInfo, FiZap } from "react-icons/fi";
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
        const interval = setInterval(fetchQueues, 30000);
        return () => clearInterval(interval);
    }, [fetchQueues]);

    const handleBookingClick = (queue) => {
        if (!user) {
            alert("กรุณาเข้าสู่ระบบก่อนทำการจองคิว");
            navigate("/login");
            return;
        }
        if (user.rolestatus !== "CUSTOMER") {
            alert("เฉพาะบัญชีลูกค้าเท่านั้นที่สามารถจองคิวได้");
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
                fetchQueues();
            }
        } catch (err) {
            alert("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
        }
    };

    if (loading) return (
        <div className="pq-loader-container">
            <div className="pq-dot-spinner"></div>
            <p>กำลังค้นหาช่วงเวลาว่าง...</p>
        </div>
    );

    return (
        <div className="pq-main-bg">
            <div className="pq-glass-header">
                <button className="pq-back-btn" onClick={() => navigate(-1)}>
                    <FiChevronLeft size={24} />
                </button>
                <div className="pq-title-wrapper">
                    <h1>เลือกช่วงเวลา</h1>
                    <p>เก้าอี้บริการ #{chairId} • วันนี้</p>
                </div>
            </div>

            <div className="pq-timeline-container">
                {queues.map((q) => {
                    const isMine = user && q.customer_id === user.id;
                    const status = q.status; // AVAILABLE, BOOKED, NO_SHOW, etc.

                    return (
                        <div key={q.id} className={`pq-time-card st-${status.toLowerCase()} ${isMine ? 'is-mine' : ''}`}>
                            <div className="pq-time-side">
                                <span className="pq-start">{q.start_time}</span>
                                <div className="pq-line"></div>
                                <span className="pq-end">{q.end_time}</span>
                            </div>

                            <div className="pq-content-side">
                                {isMine ? (
                                    <div className="pq-mine-info">
                                        <div className="pq-badge-mine">
                                            <FiCheck /> คิวของคุณ
                                        </div>
                                        <p>คุณมีนัดหมายในเวลานี้</p>
                                    </div>
                                ) : status === "AVAILABLE" ? (
                                    <div className="pq-avail-info">
                                        <span className="pq-label-avail">ว่างให้บริการ</span>
                                        <button className="pq-btn-select" onClick={() => handleBookingClick(q)}>
                                            <FiZap /> จองตอนนี้
                                        </button>
                                    </div>
                                ) : (
                                    <div className="pq-status-info">
                                        <span className={`pq-status-tag ${status.toLowerCase()}`}>
                                            {status === "BOOKED" && "ถูกจองโดยผู้อื่น"}
                                            {status === "NO_SHOW" && "เลยกำหนดเวลา"}
                                            {status === "CHECKIN" && "กำลังให้บริการ"}
                                            {status === "COMPLETE" && "บริการเสร็จสิ้น"}
                                        </span>
                                    </div>
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
                        <div className="pq-modal-icon-wrap"><FiInfo size={32} /></div>
                        <h2>ยืนยันนัดหมาย</h2>
                        <div className="pq-confirm-details">
                            <p>เวลา <span>{selectedQueue?.start_time} - {selectedQueue?.end_time} น.</span></p>
                            <small>* กรุณามาก่อนเวลา 10 นาทีเพื่อเตรียมตัว</small>
                        </div>
                        <div className="pq-modal-btns">
                            <button className="pq-btn-no" onClick={() => setShowConfirm(false)}>เปลี่ยนใจ</button>
                            <button className="pq-btn-yes" onClick={confirmBooking}>ยืนยันการจอง</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal จองสำเร็จ */}
            {showSuccess && (
                <div className="pq-modal-overlay">
                    <div className="pq-modal-card pq-success">
                        <div className="pq-success-anim">
                            <FiCheck size={40} />
                        </div>
                        <h2>จองสำเร็จ!</h2>
                        <p>รหัสคิวของคุณคือ: <strong>{bookingRef}</strong></p>
                        <button className="pq-btn-finish" onClick={() => navigate("/booked-table")}>
                            ดูคิวของฉัน
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}