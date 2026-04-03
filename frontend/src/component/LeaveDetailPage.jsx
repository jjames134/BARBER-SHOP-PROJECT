import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect, useContext, useCallback } from "react";
import { DataContext } from "../DataContext";
import "./style/LeaveDetailPage.css";

export default function LeaveDetailPage() {
  const { id } = useParams(); // ดึงเลข ID จาก URL เช่น /leave-detail/1
  const navigate = useNavigate();
  const { baseURL } = useContext(DataContext);

  const [leaveRequest, setLeaveRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeader = useCallback(() => ({
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json"
  }), []);

  // ฟังก์ชันดึงข้อมูลจาก Backend โดยใช้ ID
  const fetchLeaveDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${baseURL}/barber_manage/leave_letter/${id}`, {
        headers: getAuthHeader()
      });

      if (res.ok) {
        const data = await res.json();
        setLeaveRequest(data);
      } else {
        setError("ไม่พบข้อมูลใบลาฉบับนี้");
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  }, [baseURL, id, getAuthHeader]);

  useEffect(() => {
    if (baseURL && id) {
      fetchLeaveDetail();
    }
  }, [fetchLeaveDetail, baseURL, id]);

  // ฟังก์ชัน อนุมัติ / ปฏิเสธ
  const handleUpdateStatus = async (newStatus) => {
    if (!window.confirm(`คุณแน่ใจใช่ไหมที่จะ ${newStatus === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ'} การลานี้?`)) return;

    try {
      const res = await fetch(`${baseURL}/barber_manage/update_leave_status/${id}?status=${newStatus}`, {
        method: "POST",
        headers: getAuthHeader()
      });

      if (res.ok) {
        alert("ดำเนินการสำเร็จ");
        navigate("/manage-user"); // กลับหน้าหลักจัดการร้าน
      } else {
        const err = await res.json();
        alert(err.detail || "ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
    }
  };

  if (loading) return <div className="leave-detail-page"><div className="loader">กำลังโหลดข้อมูล...</div></div>;
  if (error) return <div className="leave-detail-page"><div className="error-card"><h1>{error}</h1><button onClick={() => navigate(-1)}>ย้อนกลับ</button></div></div>;

  return (
    <div className="leave-detail-page">
      <button className="back-button" onClick={() => navigate(-1)}>←</button>

      <div className="leave-detail-card">
        <h1>รายละเอียดการแจ้งลา</h1>

        <div className="detail-section">
          <div className="detail-item">
            <label>ชื่อพนักงาน</label>
            <p className="detail-value">
              {leaveRequest.barber?.user_data?.firstname} {leaveRequest.barber?.user_data?.lastname}
            </p>
          </div>

          <div className="detail-item">
            <label>วันที่ขอลาหยุด</label>
            <p className="detail-value">
              {new Date(leaveRequest.date_leave).toLocaleDateString('th-TH', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>

          <div className="detail-item">
            <label>สถานะ</label>
            <span className={`status-badge-detail ${leaveRequest.status.toLowerCase()}`}>
              {leaveRequest.status === 'PENDING' ? '⏳ รอการตัดสินใจ' : 
               leaveRequest.status === 'APPROVED' ? '✅ อนุมัติแล้ว' : '❌ ปฏิเสธ'}
            </span>
          </div>

          <div className="detail-item">
            <label>เหตุผล/บันทึก</label>
            <div className="reason-content">
              {leaveRequest.report || "ไม่ได้ระบุเหตุผล"}
            </div>
          </div>
        </div>

        {/* ปุ่มควบคุม: จะโชว์เฉพาะเมื่อสถานะเป็น PENDING (รออนุมัติ) เท่านั้น */}
        {leaveRequest.status === "PENDING" && (
          <div className="action-buttons">
            <button className="approve-btn" onClick={() => handleUpdateStatus("APPROVED")}>อนุมัติ</button>
            <button className="reject-btn" onClick={() => handleUpdateStatus("REJECTED")}>ปฏิเสธ</button>
          </div>
        )}
      </div>
    </div>
  );
}