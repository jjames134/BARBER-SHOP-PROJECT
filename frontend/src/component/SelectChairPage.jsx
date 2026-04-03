import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext, useCallback } from "react";
import { DataContext } from "../DataContext";
import { FiArrowLeft, FiUser, FiCalendar, FiClock, FiLock } from "react-icons/fi"; 
import "./style/SelectChairPage.css";
import chairImg from "./Image/Barber_chair.png";

export default function ChairPage() {
    const navigate = useNavigate();
    const { baseURL } = useContext(DataContext);

    const [chairs, setChairs] = useState([]);
    const [shopData, setShopData] = useState({ status: "loading", message: "" });
    const [loading, setLoading] = useState(true);
    const [todayTH, setTodayTH] = useState("");

    useEffect(() => {
        setTodayTH(new Date().toLocaleDateString("th-TH", {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }));
    }, []);

    const fetchChairs = useCallback(async () => {
        setLoading(true);
        try {
            // เรียก API โดยให้ Backend เช็คเวลา Server เอง
            const res = await fetch(`${baseURL}/queue_service/chairs`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
            });

            const data = await res.json();
            
            if (data.shop_status === "closed") {
                setShopData({ status: "closed", message: data.message });
            } else {
                setChairs(data.chairs || []);
                setShopData({ status: "open", message: "" });
            }
        } catch (error) {
            setShopData({ status: "closed", message: "การเชื่อมต่อเซิร์ฟเวอร์ขัดข้อง" });
        } finally {
            setLoading(false);
        }
    }, [baseURL]);

    useEffect(() => { fetchChairs(); }, [fetchChairs]);

    if (loading) return (
        <div className="sc-loader-wrapper">
            <div className="sc-loader-spinner"></div>
            <p>กำลังเตรียมข้อมูลเก้าอี้...</p>
        </div>
    );

    // หน้าจอเมื่อร้านปิด (เช็คจากเวลา Server และสถานะใน DB)
    if (shopData.status === "closed") {
        return (
            <div className="sc-closed-container">
                <div className="sc-closed-glass">
                    <div className="sc-closed-icon-ring">
                        <FiLock size={40} />
                    </div>
                    <h1>ขออภัย ร้านปิดบริการ</h1>
                    <p>{shopData.message}</p>
                    <button className="sc-back-home-btn" onClick={() => navigate("/")}>
                        กลับหน้าหลัก
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="sc-main-layout">
            <div className="sc-background-blob"></div>
            
            <header className="sc-app-bar">
                <button className="sc-icon-btn" onClick={() => navigate(-1)}>
                    <FiArrowLeft size={24} />
                </button>
                <div className="sc-header-content">
                    <h1>เลือกเก้าอี้บริการ</h1>
                    <span><FiCalendar style={{marginRight: '5px'}}/> {todayTH}</span>
                </div>
                <div style={{width: '40px'}}></div> {/* Spacer */}
            </header>

            <main className="sc-content">
                <div className="sc-grid-container">
                    {chairs.map((chair) => (
                        <div key={chair.id} className={`sc-item-card ${chair.status}`}>
                            {/* จำนวนคิวที่ว่าง */}
                            {chair.status === "ready" && (
                                <div className="sc-count-tag">
                                    <FiClock size={12} /> ว่าง {chair.available_count} รอบ
                                </div>
                            )}

                            <div className="sc-card-inner">
                                <div className="sc-image-section">
                                    <img 
                                        src={chairImg} 
                                        alt="barber-chair" 
                                        className="sc-main-img"
                                        style={!chair.allowBooking ? { filter: "grayscale(1) opacity(0.3)" } : {}}
                                    />
                                </div>

                                <div className="sc-details-section">
                                    <h2 className="sc-chair-title">{chair.name}</h2>
                                    <div className="sc-barber-info">
                                        <FiUser size={14} />
                                        <span>{chair.barber_name ? `ช่าง ${chair.barber_name}` : "ไม่มีช่างประจำ"}</span>
                                    </div>
                                    
                                    <div className={`sc-status-pill status-${chair.status}`}>
                                        <span className="sc-pulse-dot"></span>
                                        {chair.statusText}
                                    </div>
                                </div>

                                <button 
                                    className="sc-action-button"
                                    disabled={!chair.allowBooking}
                                    onClick={() => navigate(`/booking/${chair.id}`)}
                                >
                                    {chair.allowBooking ? "จองคิวตอนนี้" : "ไม่สามารถจองได้"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}