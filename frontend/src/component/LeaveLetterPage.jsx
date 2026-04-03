import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { DataContext } from "../DataContext";
import "./style/LeaveLetterPage.css";

export default function LeaveLetter() {
  const navigate = useNavigate();
  const { baseURL } = useContext(DataContext);
  
  const [form, setForm] = useState({
    date: "",
    reason: ""
  });

  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // ตรวจสอบวันที่: ห้ามเลือกวันที่ย้อนหลัง
  const today = new Date().toISOString().split("T")[0];

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.date || !form.reason.trim()) {
      alert("กรุณาระบุวันที่และสาเหตุการลาให้ครบถ้วน");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${baseURL}/barber_manage/send_leave_letter`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date_leave: form.date, // ส่งให้ตรงกับ Schema: LetterCreate
          report: form.reason    // ส่งให้ตรงกับ Schema: LetterCreate
        })
      });

      const result = await response.json();

      if (response.ok) {
        setShowConfirm(false);
        setShowSuccess(true);
        // หมายเหตุ: Backend ของคุณจะเรียกใช้ notify_requeste อัตโนมัติในฝั่ง Server
      } else {
        // จัดการ Error เช่น ลาซ้ำวันเดิม (HTTP 400)
        alert(result.detail || "ไม่สามารถส่งคำขอลาได้");
        setShowConfirm(false);
      }
    } catch (error) {
      console.error("Leave Request Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  const closeSuccess = () => {
    setShowSuccess(false);
    navigate("/"); // ส่งเสร็จแล้วกลับหน้าแรก
  };

  return (
    <div className="leave-page">
      {/* ปุ่มย้อนกลับทรงกลม */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <img src="/images/icon-back.png" alt="back" style={{ width: '20px' }} 
             onError={(e) => e.target.style.display = 'none'} />
        <span style={{ position: 'absolute' }}>←</span>
      </button>

      <div className="leave-card">
        <h1>แจ้งลาหยุด</h1>
        <p style={{ textAlign: 'center', color: '#888', marginBottom: '25px', fontSize: '14px' }}>
          คำขอของคุณจะถูกส่งไปยังเจ้าของร้านเพื่อพิจารณา
        </p>

        <div className="form-group">
          <label>วันที่ต้องการลา</label>
          <input
            type="date"
            value={form.date}
            min={today}
            onChange={(e) => handleChange("date", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>สาเหตุการลา / หมายเหตุ</label>
          <textarea
            value={form.reason}
            onChange={(e) => handleChange("reason", e.target.value)}
            placeholder="เช่น ลากิจไปทำธุระ หรือ ลาป่วย..."
          />
        </div>

        <button className="submit-button" onClick={handleSubmit} disabled={loading}>
          {loading ? "กำลังดำเนินการ..." : "ยืนยันส่งคำขอ"}
        </button>
      </div>

      {/* --- Modal ยืนยัน (Confirm Modal) --- */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => !loading && setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>ยืนยันการแจ้งลา?</h3>
            <div className="confirm-info">
              <p><strong>วันที่ลา:</strong> {new Date(form.date).toLocaleDateString('th-TH', { 
                year: 'numeric', month: 'long', day: 'numeric' 
              })}</p>
              <p><strong>เหตุผล:</strong> {form.reason}</p>
            </div>
            <div className="modal-buttons">
              <button 
                className="cancel-btn" 
                onClick={() => setShowConfirm(false)} 
                disabled={loading}
              >
                แก้ไข
              </button>
              <button 
                className="confirm-btn" 
                onClick={handleConfirm} 
                disabled={loading}
              >
                {loading ? "กำลังส่ง..." : "ตกลง"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal สำเร็จ (Success Modal) --- */}
      {showSuccess && (
        <div className="modal-overlay">
          <div className="modal success-modal">
            <div className="success-icon">✓</div>
            <h3 style={{ color: '#28a745' }}>ส่งคำขอเรียบร้อย!</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>
              ระบบได้แจ้งเตือนเจ้าของร้านแล้ว <br/> 
              กรุณารอการตรวจสอบในเมนูแจ้งเตือนของคุณ
            </p>
            <button className="done-btn" onClick={closeSuccess}>
              กลับหน้าหลัก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}