import { useNavigate } from "react-router-dom";
import { useState, useEffect, useContext, useCallback } from "react";
import { DataContext } from "../DataContext";
import "./style/ManageUser.css";

export default function ManageUser() {
  const navigate = useNavigate();
  const { baseURL } = useContext(DataContext);

  const [activeTab, setActiveTab] = useState("staff");
  const [users, setUsers] = useState([]);         // ลูกค้าทั่วไป
  const [staff, setStaff] = useState([]);         // ช่างตัดผม (Barbers)
  const [leaveRequests, setLeaveRequests] = useState([]); // จดหมายลา
  const [chairs, setChairs] = useState([]);       // เก้าอี้ในร้าน
  const [loading, setLoading] = useState(false);

  // Helper สำหรับส่ง Header (ดึง Token ล่าสุดเสมอ)
  const getAuthHeader = useCallback(() => ({
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json"
  }), []);

  // --- 🔄 ฟังก์ชันดึงข้อมูลทั้งหมด ---
  const fetchData = useCallback(async () => {
    if (!baseURL) return;
    setLoading(true);
    try {
      const headers = getAuthHeader();
      const [resCust, resStaff, resLeave, resChairs] = await Promise.all([
        fetch(`${baseURL}/barber_manage/customer`, { headers }),
        fetch(`${baseURL}/barber_manage/barber_view`, { headers }),
        fetch(`${baseURL}/barber_manage/leave_letter`, { headers }),
        fetch(`${baseURL}/data_service/chairs`, { headers })
      ]);

      const customers = await resCust.json();
      const barbers = await resStaff.json();
      const leaves = await resLeave.json();
      const chairData = await resChairs.json();

      setUsers(Array.isArray(customers) ? customers : []);
      setStaff(Array.isArray(barbers) ? barbers : []);
      setChairs(Array.isArray(chairData) ? chairData : []);
      setLeaveRequests(Array.isArray(leaves) ? leaves : []);

      // สะกิด Layout อัปเดตจุดแดงแจ้งเตือน
      window.dispatchEvent(new Event("refreshBadges"));

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, [baseURL, getAuthHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- 🪑 ฟังก์ชันมอบหมายเก้าอี้ ---
  const handleAssign = async (barberId, chairId) => {
    if (!chairId) return;
    try {
      const res = await fetch(`${baseURL}/barber_manage/assign_chair?chair_id=${chairId}&barber_id=${barberId}`, {
        method: "POST",
        headers: getAuthHeader()
      });
      if (res.ok) {
        alert("มอบหมายเก้าอี้สำเร็จ");
        fetchData();
      } else {
        const err = await res.json();
        alert(err.detail || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      alert("ไม่สามารถดำเนินการได้");
    }
  };

  // --- ❌ ฟังก์ชันยกเลิกเก้าอี้ ---
  const handleUnassign = async (chairId) => {
    try {
      const res = await fetch(`${baseURL}/barber_manage/unassign_chair?chair_id=${chairId}`, {
        method: "POST",
        headers: getAuthHeader()
      });
      if (res.ok) {
        alert("ยกเลิกการมอบหมายแล้ว");
        fetchData();
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  // --- 👷 ฟังก์ชันตั้งเป็นพนักงาน (Grant) ---
  const handleGrantStaff = async (userId) => {
    if (!window.confirm("ต้องการตั้งผู้ใช้คนนี้เป็นพนักงานใช่หรือไม่?")) return;
    try {
      const res = await fetch(`${baseURL}/barber_manage/grant/${userId}`, {
        method: "POST",
        headers: getAuthHeader()
      });
      if (res.ok) {
        alert("เพิ่มพนักงานใหม่สำเร็จ");
        // ย้ายไปหน้าพนักงานทันทีเพื่อให้เห็นผล
        setActiveTab("staff");
        fetchData();
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาด");
    }
  };

  // --- 🗑️ ฟังก์ชันลบพนักงาน (Revoke) ---
  const handleRevoke = async (barberId) => {
    if (!window.confirm("ยืนยันการถอนสิทธิ์พนักงาน? (ข้อมูลเก้าอี้จะถูกล้างด้วย)")) return;
    try {
      const res = await fetch(`${baseURL}/barber_manage/revoke/${barberId}`, {
        method: "POST",
        headers: getAuthHeader()
      });

      if (res.ok) {
        alert("ถอนสิทธิ์สำเร็จ");
        
        /** * 🔥 แก้ปัญหาข้อมูลค้าง: 
         * กรองรายชื่อพนักงานออกทันทีใน State (ไม่ต้องรอ Fetch ใหม่)
         * เพื่อให้ UI อัปเดตหายไปจากหน้าจอทันที
         */
        setStaff(prevStaff => prevStaff.filter(s => s.id !== barberId));

        // ดึงข้อมูลใหม่จาก Server อีกครั้งเพื่อความชัวร์ (Sync ข้อมูลฝั่งลูกค้าด้วย)
        fetchData();
        
        window.dispatchEvent(new Event("refreshBadges"));
      } else {
        const err = await res.json();
        alert(err.detail || "เกิดข้อผิดพลาด");
      }
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  return (
    <div className="manage-user-container">
      <div className="manage-user-card-central">
        <h1 className="main-title">จัดการร้านและการทำงาน</h1>

        {/* --- Navigation Tabs --- */}
        <div className="custom-tabs">
          <button className={activeTab === "staff" ? "active" : ""} onClick={() => setActiveTab("staff")}>
            พนักงาน ({staff.length})
          </button>
          <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>
            ลูกค้า ({users.length})
          </button>
          <button className={activeTab === "leave" ? "active" : ""} onClick={() => setActiveTab("leave")}>
            จดหมายลา 
            {leaveRequests.filter(l => l.status === 'PENDING').length > 0 && <span className="tab-badge">!</span>}
          </button>
        </div>

        <div className="table-section">
          {loading ? <p className="loading-text">กำลังโหลดข้อมูล...</p> : (
            <>
              {/* --- TAB: พนักงาน (Staff) --- */}
              {activeTab === "staff" && (
                <table className="manage-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ชื่อ-นามสกุล</th>
                      <th>เก้าอี้ประจำ</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.length > 0 ? staff.map((s, index) => {
                      const isOwner = s.user_data?.rolestatus === "OWNER";
                      const myChair = chairs.find(c => c.barber_id === s.id);
                      const todayStr = new Date().toLocaleDateString('en-CA');
                      const isOnLeave = leaveRequests.some(l => 
                        l.barber_id === s.id && l.date_leave === todayStr && l.status === "APPROVED"
                      );

                      return (
                        <tr key={s.id} className={`${isOwner ? "row-owner" : ""} ${isOnLeave ? "row-on-leave" : ""}`}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="name-wrapper">
                              <strong>{s.user_data?.firstname} {s.user_data?.lastname}</strong>
                              {isOwner && <span className="owner-badge">Owner</span>}
                              {isOnLeave && <span className="leave-badge">วันนี้ลาหยุด</span>}
                            </div>
                          </td>
                          <td>
                            <select 
                              className="table-select"
                              value={myChair ? myChair.id : ""}
                              onChange={(e) => handleAssign(s.id, e.target.value)}
                              disabled={isOnLeave}
                            >
                              <option value="">-- เลือกเก้าอี้ --</option>
                              {chairs.map(c => (
                                <option key={c.id} value={c.id} disabled={c.barber_id && c.barber_id !== s.id}>
                                  {c.name} {c.barber_id && c.barber_id !== s.id ? "(ไม่ว่าง)" : ""}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div className="btn-group">
                              {myChair && <button className="btn-unassign" onClick={() => handleUnassign(myChair.id)}>เอาเก้าอี้ออก</button>}
                              {!isOwner && <button className="btn-revoke-staff" onClick={() => handleRevoke(s.id)}>ลบพนักงาน</button>}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : <tr><td colSpan="4" className="no-data">ไม่พบข้อมูลพนักงาน</td></tr>}
                  </tbody>
                </table>
              )}

              {/* --- TAB: ลูกค้า (Customers) --- */}
              {activeTab === "all" && (
                <table className="manage-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>ชื่อ-นามสกุล</th>
                      <th>เบอร์โทรศัพท์</th>
                      <th>สิทธิ์พนักงาน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? users.map((u, i) => (
                      <tr key={u.id}>
                        <td>{i + 1}</td>
                        <td>{u.firstname} {u.lastname}</td>
                        <td>{u.phone || "-"}</td>
                        <td>
                          <button className="btn-grant" onClick={() => handleGrantStaff(u.id)}>ตั้งเป็นพนักงาน</button>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="4" className="no-data">ไม่พบข้อมูลลูกค้า</td></tr>}
                  </tbody>
                </table>
              )}

              {/* --- TAB: จดหมายลา (Leave Letters) --- */}
              {activeTab === "leave" && (
                <table className="manage-table">
                  <thead>
                    <tr>
                      <th>สถานะ</th>
                      <th>ชื่อพนักงาน</th>
                      <th>วันที่ลา</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.length > 0 ? leaveRequests.map((l) => (
                      <tr key={l.id} className={l.status === 'PENDING' ? "row-pending" : ""}>
                        <td>
                          <span className={`status-badge ${l.status.toLowerCase()}`}>
                            {l.status === 'PENDING' ? '⏳ รออนุมัติ' : l.status === 'APPROVED' ? '✅ อนุมัติแล้ว' : '❌ ปฏิเสธ'}
                          </span>
                        </td>
                        <td className="font-bold">{l.barber?.user_data?.firstname} {l.barber?.user_data?.lastname}</td>
                        <td>{new Date(l.date_leave).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>
                          <button className="btn-view" onClick={() => navigate(`/leave-detail/${l.id}`)}>ดูรายละเอียด</button>
                        </td>
                      </tr>
                    )) : <tr><td colSpan="4" className="no-data">ไม่มีข้อมูลการแจ้งลา</td></tr>}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}