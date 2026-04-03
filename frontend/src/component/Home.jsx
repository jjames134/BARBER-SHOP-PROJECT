import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext, useMemo } from "react";
import { DataContext } from "../DataContext";
import "./style/Home.css";

export default function Home() {
    const navigate = useNavigate();
    const { islogin, role, heroSlides, promoSlides, announcementText, baseURL, authLoading } = useContext(DataContext) || {};

    // 1. จัดการ Banner (Hero Slides) - สไลด์อัตโนมัติ
    const [currHero, setCurrHero] = useState(0);
    const safeHeros = useMemo(() => heroSlides?.length > 0 ? heroSlides : [{path_img: "default-hero.jpg"}], [heroSlides]);

    useEffect(() => {
        const hInt = setInterval(() => {
            setCurrHero(p => (p + 1) % safeHeros.length);
        }, 5000);
        return () => clearInterval(hInt);
    }, [safeHeros]);

    // 2. จัดการภาพโปรโมชั่น (Promo Slides) - สุ่มภาพเมื่อ Reload
    const randomPromo = useMemo(() => {
        if (!promoSlides || promoSlides.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * promoSlides.length);
        return promoSlides[randomIndex];
    }, [promoSlides]); // จะทำงานใหม่เมื่อ promoSlides เปลี่ยน (หรือ reload หน้า)

    const handleBookingClick = () => {
        if (!islogin) {
            navigate('/login');
        } else {
            if (role === 'OWNER' || role === 'BARBER') {
                navigate('/working-table');
            } else {
                navigate('/chair');
            }
        }
    };

    if (authLoading) return <div className="loading-screen">กำลังโหลด...</div>;

    return (
        <div className="home-container">
            {/* ส่วนที่ 1: Hero Banner (Auto Slide) */}
            <header className="hero-section">
                {safeHeros.map((slide, idx) => (
                    <div 
                        key={slide.id || idx} 
                        className={`hero-slide ${idx === currHero ? "active" : ""}`}
                        style={{ backgroundImage: `url(${baseURL}/${slide.path_img})` }}
                    >
                        <div className="hero-overlay">
                            <h1 className="hero-title">Sharp Looks, Modern Style</h1>
                        </div>
                    </div>
                ))}
                <div className="hero-dots">
                    {safeHeros.map((_, idx) => (
                        <span key={idx} className={`dot ${idx === currHero ? "active" : ""}`} />
                    ))}
                </div>
            </header>

            {/* ส่วนที่ 2: Announcement (คำบรรยาย) */}
            <section className="announcement-section">
                <div className="content-wrapper">
                    <h2 className="section-label">ประกาศจากทางร้าน</h2>
                    <div 
                        className="description-text"
                        dangerouslySetInnerHTML={{ __html: announcementText || "ยินดีต้อนรับสู่ Barber Shop" }} 
                    />
                </div>
            </section>

            {/* ส่วนที่ 3: Promo Display (สุ่มภาพสลับ) */}
            <section className="promo-section">
                <div className="promo-card">
                    {randomPromo ? (
                        <img 
                            src={`${baseURL}/${randomPromo.path_img}`} 
                            alt="Promotion" 
                            className="promo-img-main"
                        />
                    ) : (
                        <div className="promo-placeholder">Barber Shop Service</div>
                    )}
                    
                    <div className="promo-action">
                        <button onClick={handleBookingClick} className="btn-main-booking">
                            {islogin ? "จองคิวตอนนี้" : "เข้าสู่ระบบเพื่อจองคิว"}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}