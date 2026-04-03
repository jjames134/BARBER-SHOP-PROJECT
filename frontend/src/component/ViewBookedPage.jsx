import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect, useCallback } from "react";
import { DataContext } from "../DataContext";
import { FiCalendar, FiClock, FiUser, FiArrowLeft, FiTrash2, FiMapPin, FiAlertCircle } from "react-icons/fi";
import "./style/ViewBookedPage.css";

export default function BookedPage() {
    const navigate = useNavigate();
    const { baseURL, fetchWithAuth } = useContext(DataContext);
    const [bookedQueues, setBookedQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedCancelItem, setSelectedCancelItem] = useState(null);

    const fetchMyBookedQueues = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`${baseURL}/queue_service/my-bookings`);
            if (res.ok) {
                const data = await res.json();
                setBookedQueues(data);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [baseURL, fetchWithAuth]);

    useEffect(() => {
        fetchMyBookedQueues();
    }, [fetchMyBookedQueues]);

    const handleCancelClick = (item) => {
        setSelectedCancelItem(item);
        setShowCancelModal(true);
    };

    const confirmCancel = async () => {
        try {
            const res = await fetchWithAuth(`${baseURL}/queue_service/cancel-booking/${selectedCancelItem.id}`, {
                method: "DELETE",
            });

            if (res.ok) {
                setBookedQueues(prev => prev.filter(q => q.id !== selectedCancelItem.id));
                setShowCancelModal(false);
                setSelectedCancelItem(null);
            } else {
                alert("ไม่สามารถยกเลิกได้ในขณะนี้");
            }
        } catch (err) {
            alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        }
    };

    if (loading) return (
        <div className="vb-loader-wrapper">
            <div className="vb-spinner"></div>
            <p>กำลังเตรียมรายการจองของคุณ...</p>
        </div>
    );

    return (
        <div className="vb-main-container">
            {/* Header */}
            <header className="vb-header">
                <button className="vb-back-btn" onClick={() => navigate(-1)}>
                    <FiArrowLeft size={24} />
                </button>
                <div className="vb-header-title">
                    <h1>การจองของฉัน</h1>
                    <p>รายการนัดหมายตัดผมทั้งหมดของคุณ</p>
                </div>
            </header>

            <main className="vb-content">
                {bookedQueues.length === 0 ? (
                    <div className="vb-empty">
                        <div className="vb-empty-icon"><FiCalendar size={60} /></div>
                        <h2>ยังไม่มีการจองคิว</h2>
                        <p>จองคิวตัดผมตอนนี้ เพื่อความสะดวกของคุณ</p>
                        <button className="vb-btn-primary" onClick={() => navigate("/select-chair")}>
                            เริ่มจองคิวครั้งแรก
                        </button>
                    </div>
                ) : (
                    <div className="vb-list">
                        {bookedQueues.map((item) => (
                            <div key={item.id} className="vb-card">
                                <div className="vb-card-top">
                                    <div className="vb-chair-tag">
                                        <FiMapPin size={14} />
                                        <span>เก้าอี้ {item.chair_name || item.chair_id}</span>
                                    </div>
                                    <div className={`vb-status-badge ${item.status.toLowerCase()}`}>
                                        {item.status === "BOOKED" ? "จองสำเร็จ" : "กำลังดำเนินการ"}
                                    </div>
                                </div>

                                <div className="vb-card-body">
                                    <div className="vb-info-row">
                                        <div className="vb-icon-circle"><FiClock /></div>
                                        <div className="vb-info-text">
                                            <label>เวลาให้บริการ</label>
                                            <strong>{item.start_time.substring(0, 5)} - {item.end_time.substring(0, 5)} น.</strong>
                                        </div>
                                    </div>

                                    <div className="vb-info-row">
                                        <div className="vb-icon-circle"><FiUser /></div>
                                        <div className="vb-info-text">
                                            <label>ช่างผู้ให้บริการ</label>
                                            <strong>{item.barber_name || "ช่างประจำร้าน"}</strong>
                                        </div>
                                    </div>

                                    <div className="vb-info-row">
                                        <div className="vb-icon-circle"><FiCalendar /></div>
                                        <div className="vb-info-text">
                                            <label>วันที่นัดหมาย</label>
                                            <strong>{new Date(item.date_working).toLocaleDateString('th-TH', { 
                                                day: 'numeric', month: 'long', year: 'numeric' 
                                            })}</strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="vb-card-footer">
                                    <button className="vb-cancel-btn" onClick={() => handleCancelClick(item)}>
                                        <FiTrash2 /> ยกเลิกการจองนี้
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="vb-modal-overlay">
                    <div className="vb-modal">
                        <div className="vb-modal-alert-icon"><FiAlertCircle size={40} /></div>
                        <h3>ยืนยันการยกเลิก</h3>
                        <p>คุณต้องการยกเลิกการจองเวลา <strong>{selectedCancelItem?.start_time.substring(0, 5)} น.</strong> หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
                        <div className="vb-modal-actions">
                            <button className="vb-btn-back" onClick={() => setShowCancelModal(false)}>ย้อนกลับ</button>
                            <button className="vb-btn-confirm-delete" onClick={confirmCancel}>ใช่, ยกเลิกการจอง</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}