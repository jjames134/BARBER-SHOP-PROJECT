import { useState, useContext, useRef } from "react";
import { DataContext } from "../DataContext";
import { useNavigate } from "react-router-dom";
import "./style/CustomWebPage.css";

export default function CustomWebPage() {
    const navigate = useNavigate();
    const { 
        baseURL, 
        heroSlides, // รูป Banner สไลด์หลัก
        promoSlides, // รูปโปรโมชั่นส่วนที่ 2
        announcementText, 
        setAnnouncementText, 
        fetchWebsiteConfig 
    } = useContext(DataContext);
    
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(false);
    
    // สร้าง Ref สำหรับ Input File เพื่อซ่อน Native UI และใช้ปุ่มสวยๆ แทน
    const fileInputRef1 = useRef(null);
    const fileInputRef2 = useRef(null);

    // ฟังก์ชันอัปโหลดรูป
    const uploadImg = async (e, cate) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // ตรวจสอบขนาดไฟล์ (เช่น ไม่เกิน 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert("ไฟล์รูปภาพใหญ่เกินไป (จำกัดไม่เกิน 2MB)");
            return;
        }

        const fd = new FormData();
        fd.append("file", file);
        fd.append("cate", cate);

        setLoading(true);
        try {
            const res = await fetch(`${baseURL}/data_service/website/images`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd
            });
            if (res.ok) {
                // เคลียร์ค่า input เพื่อให้เลือกไฟล์เดิมซ้ำได้
                e.target.value = null; 
                fetchWebsiteConfig(); // สั่ง Context โหลดข้อมูลใหม่
            } else {
                const err = await res.json();
                throw new Error(err.detail || "อัปโหลดไม่สำเร็จ");
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ฟังก์ชันลบรูป (ทำ Modal ยืนยันให้สวยขึ้น)
    const deleteImg = async (id) => {
        if (!window.confirm("คุณต้องการลบรูปภาพนี้ใช่หรือไม่?")) return;
        
        setLoading(true);
        try {
            const res = await fetch(`${baseURL}/data_service/website/images/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchWebsiteConfig();
            } else {
                throw new Error("ลบรูปภาพไม่สำเร็จ");
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ฟังก์ชันบันทึกข้อความ
    const saveDesc = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${baseURL}/data_service/website/description`, {
                method: "PATCH",
                headers: { 
                    Authorization: `Bearer ${token}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({ massege: announcementText })
            });
            if (res.ok) {
                alert("บันทึกข้อมูลเรียบร้อยแล้ว");
            } else {
                throw new Error("บันทึกไม่สำเร็จ");
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Component สำหรับปุ่มอัปโหลดแบบมินิมอล
    const UploadButton = ({ onClick, refProp }) => (
        <div className="img-card upload-placeholder" onClick={onClick}>
            <div className="upload-icon">+</div>
            <div className="upload-text">เพิ่มรูปภาพ</div>
        </div>
    );

    return (
        <div className="cwp-container">
            {/* Header */}
            <div className="cwp-header">
                <button className="cwp-back-btn" onClick={() => navigate("/")}>←</button>
                <h1 className="cwp-title">ปรับแต่งเว็บไซต์</h1>
                <p className="cwp-subtitle">จัดการรูปภาพสไลด์และข้อมูลรายละเอียดหน้าร้าน</p>
            </div>

            {/* ส่วนที่ 1: จัดการ Banner สไลด์หลัก */}
            <div className="cwp-section">
                <div className="section-header">
                    <h2 className="section-title">1. Banner สไลด์หน้าแรก (Hero Section)</h2>
                    <p className="section-desc">รูปภาพขนาดใหญ่ที่จะแสดงด้านบนสุดของเว็บไซต์ (แนะนำขนาด 1920x800px)</p>
                </div>
                
                <div className="image-manager-grid">
                    {heroSlides.map(img => (
                        <div key={img.id} className="img-card has-image">
                            <img src={`${baseURL}/${img.path_img}`} alt="Banner Slide" />
                            <div className="card-overlay">
                                <button className="btn-delete-img" onClick={() => deleteImg(img.id)}>ลบรูป</button>
                            </div>
                        </div>
                    ))}
                    
                    {/* ซ่อน Native Input และใช้ Ref ควบคุม */}
                    <input type="file" ref={fileInputRef1} onChange={(e) => uploadImg(e, "BANNER")} hidden accept="image/*" />
                    <UploadButton onClick={() => fileInputRef1.current.click()} />
                </div>
            </div>

            {/* ส่วนที่ 2: จัดการรูปโปรโมชั่น (เพิ่ม Logic นี้ให้ครบตาม UI ที่ส่งมา) */}
            <div className="cwp-section">
                <div className="section-header">
                    <h2 className="section-title">2. รูปภาพโปรโมชั่น/บริการ (Section 2)</h2>
                    <p className="section-desc">รูปภาพขนาดกลางสำหรับโชว์บริการหรือโปรโมชั่น (แนะนำขนาด 800x600px)</p>
                </div>
                
                <div className="image-manager-grid">
                    {(promoSlides || []).map(img => (
                        <div key={img.id} className="img-card has-image middle-size">
                            <img src={`${baseURL}/${img.path_img}`} alt="Promo Slide" />
                            <div className="card-overlay">
                                <button className="btn-delete-img" onClick={() => deleteImg(img.id)}>ลบรูป</button>
                            </div>
                        </div>
                    ))}
                    
                    <input type="file" ref={fileInputRef2} onChange={(e) => uploadImg(e, "MAIN_IMG")} hidden accept="image/*" />
                    <UploadButton onClick={() => fileInputRef2.current.click()} />
                </div>
            </div>

            {/* ส่วนที่ 3: จัดการข้อความรายละเอียด */}
            <div className="cwp-section announcement-section">
                <div className="section-header">
                    <h2 className="section-title">3. รายละเอียดเพิ่มเติมของร้าน</h2>
                    <p className="section-desc">ข้อความต้อนรับ, ประกาศ หรือรายละเอียดบริการ (รองรับรูปแบบ HTML เบื้องต้น)</p>
                </div>
                
                <div className="textarea-container">
                    <textarea 
                        value={announcementText} 
                        onChange={(e) => setAnnouncementText(e.target.value)}
                        placeholder="กรอกรายละเอียดที่นี่... (คุณสามารถใช้ <br> เพื่อขึ้นบรรทัดใหม่ หรือ <b> เพื่อทำตัวหนา)"
                        className="cwp-textarea"
                    />
                    <div className="textarea-footer">
                        <span>จำนวนตัวอักษร: {announcementText?.length || 0}</span>
                        <button onClick={saveDesc} className="cwp-btn-save" disabled={loading}>
                            {loading ? "กำลังบันทึก..." : "บันทึกข้อความ"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            {loading && (
                <div className="cwp-loading-overlay">
                    <div className="spinner"></div>
                    <p>กำลังประมวลผล...</p>
                </div>
            )}
        </div>
    );
}