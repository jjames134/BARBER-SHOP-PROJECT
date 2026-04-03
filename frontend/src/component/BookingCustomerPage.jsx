import { useNavigate, useParams } from "react-router-dom"
import { useState, useContext } from "react"
import { DataContext } from "../DataContext"
import "./style/BookingCustomerPage.css"

export default function BookingCustomerPage(){
    const navigate = useNavigate();
    const { chairId } = useParams();
    const { bookedQueues, setBookedQueues } = useContext(DataContext);

    const [selectedSlot, setSelectedSlot] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // ข้อมูลจำลองสำหรับช่วงเวลา
    const [timeSlots, setTimeSlots] = useState([
        { id: 1, time: "10.00-11.00 น.", status: "available" },
        { id: 2, time: "11.00-12.00 น.", status: "available" },
        { id: 3, time: "12.00-13.00 น.", status: "available" },
        { id: 4, time: "13.00-14.00 น.", status: "booked" },
        { id: 5, time: "14.00-15.00 น.", status: "booked" },
        { id: 6, time: "16.00-17.00 น.", status: "available" },
        { id: 7, time: "17.00-18.00 น.", status: "booked" },
        { id: 8, time: "18.00-19.00 น.", status: "booked" },
        { id: 9, time: "19.00-20.00 น.", status: "booked" },
    ]);

    return (
        <div className="booking-customer-page">
            <div className="top-actions">
                <button className="back-arrow-btn" onClick={() => navigate(-1)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </button>
            </div>

            <div className="date-badge-container">
                <div className="date-badge">วันนี้</div>
            </div>

            <div className="booking-table-outline">
                <div className="booking-table-wrapper">
                    <table className="booking-table">
                        <thead>
                            <tr>
                                <th>เวลา</th>
                                <th>สถานะ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {timeSlots.map(slot => (
                                <tr key={slot.id} className={slot.status === 'booked' ? 'row-booked' : 'row-available'}>
                                    <td className="time-col">{slot.time}</td>
                                    <td className="status-col">
                                        {slot.status === 'booked' ? (
                                            <span className="status-text-booked">จองแล้ว</span>
                                        ) : (
                                            <button 
                                                className="book-queue-btn"
                                                onClick={() => {
                                                    setSelectedSlot(slot);
                                                    setShowConfirmModal(true);
                                                }}
                                            >จองคิว</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Confirm Modal */}
            {showConfirmModal && selectedSlot && (
                <div className="modal-overlay">
                    <div className="custom-modal">
                        <h3 className="modal-title">คุณต้องการยืนยันการจองคิวหรือไม่?</h3>
                        <div className="modal-details">
                            <p>วันที่: XX XX XXXX</p>
                            <p>เวลา: {selectedSlot.time}</p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setShowConfirmModal(false)}>ยกเลิก</button>
                            <button className="btn-confirm" onClick={() => {
                                setShowConfirmModal(false);
                                setShowSuccessModal(true);
                                // Set state to booked
                                setTimeSlots(timeSlots.map(s => s.id === selectedSlot.id ? { ...s, status: 'booked' } : s));
                                
                                // Save to global state so it appears in ViewBookedPage
                                const newBooking = {
                                    id: Date.now(),
                                    code: 'AB12',
                                    date: '27 03 2026',
                                    time: selectedSlot.time
                                };
                                setBookedQueues([...bookedQueues, newBooking]);
                            }}>ยืนยัน</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="custom-modal center-content">
                        <h3 className="modal-title">การจองของคุณเสร็จสมบูรณ์</h3>
                        <div className="success-icon">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="32" cy="32" r="28" stroke="black" strokeWidth="5"/>
                                <path d="M18 34 l10 10 l18 -20" stroke="black" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <p className="confirm-code">รหัสยืนยัน: AB12</p>
                        <button className="btn-done" onClick={() => setShowSuccessModal(false)}>เสร็จสิ้น</button>
                    </div>
                </div>
            )}
        </div>
    )
}
