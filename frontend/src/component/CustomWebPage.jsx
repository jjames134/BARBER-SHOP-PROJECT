import { useState, useContext } from "react";
import { DataContext } from "../DataContext";
import { useNavigate } from "react-router-dom";
import "./style/CustomWebPage.css";

export default function CustomWebPage() {
    const navigate = useNavigate();
    const { baseURL, heroSlides, promoSlides, announcementText, setAnnouncementText, fetchWebsiteConfig } = useContext(DataContext);
    const token = localStorage.getItem("token");
    const [loading, setLoading] = useState(false);

    // ฟังก์ชันอัปโหลดรูป
    const uploadImg = async (e, cate) => {
        const file = e.target.files[0];
        if (!file) return;
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
            if (res.ok) fetchWebsiteConfig(); // สั่ง Context โหลดข้อมูลใหม่
        } finally { setLoading(false); }
    };

    // ฟังก์ชันลบรูป
    const deleteImg = async (id) => {
        if (!confirm("ลบรูปนี้?")) return;
        await fetch(`${baseURL}/data_service/website/images/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchWebsiteConfig();
    };

    // ฟังก์ชันบันทึกข้อความ
    const saveDesc = async () => {
        setLoading(true);
        await fetch(`${baseURL}/data_service/website/description`, {
            method: "PATCH",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ massege: announcementText })
        });
        setLoading(false);
        alert("บันทึกเรียบร้อย");
    };

    return (
        <div className="custom-page">
            <h2>จัดการหน้าเว็บไซต์</h2>
            
            {/* จัดการ Banner */}
            <div className="config-section">
                <h3>Banner สไลด์หน้าแรก</h3>
                <div className="image-grid">
                    {heroSlides.map(img => (
                        <div key={img.id} className="img-card">
                            <img src={`${baseURL}/${img.path_img}`} />
                            <button onClick={() => deleteImg(img.id)}>×</button>
                        </div>
                    ))}
                    <input type="file" onChange={(e) => uploadImg(e, "BANNER")} />
                </div>
            </div>

            {/* จัดการข้อความ */}
            <div className="config-section">
                <h3>ข้อมูลร้าน (HTML)</h3>
                <textarea 
                    value={announcementText} 
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="modern-textarea"
                />
                <button onClick={saveDesc} className="btn-save-main" disabled={loading}>บันทึกข้อความ</button>
            </div>
        </div>
    );
}
