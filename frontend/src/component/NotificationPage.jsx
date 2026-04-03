import { useState, useEffect, useContext, useCallback } from "react";
import { DataContext } from "../DataContext";
import "./style/NotificationPage.css";

export default function Notification() {
  const { baseURL } = useContext(DataContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- 🔑 Helper สำหรับ Header ---
  const getAuthHeader = useCallback(() => ({
    "Authorization": `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json"
  }), []);

  // --- 🔄 ฟังก์ชันดึงข้อมูลการแจ้งเตือน ---
  const fetchNotifications = useCallback(async () => {
    if (!baseURL) return;
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/data_service/notifications`, {
        headers: getAuthHeader()
      });
      if (res.ok) {
        const data = await res.json();
        // data จะมีโครงสร้าง { items: [...], unread_count: X } ตามที่แก้ใน Backend
        setNotifications(data.items || []);
        setUnreadCount(data.unread_count || 0);

        // 🔴 สะกิด Layout ให้เช็คจุดแดงใหม่ (เผื่อกรณีมีคนส่งมาเพิ่มตอนเราเปิดหน้านี้พอดี)
        window.dispatchEvent(new Event("refreshBadges"));
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, [baseURL, getAuthHeader]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // --- ✅ ฟังก์ชันทำเครื่องหมายว่า "อ่านแล้ว" ---
  const handleMarkAsRead = async (id = null) => {
    try {
      // ถ้ามี id ส่งมา = อ่านเฉพาะชิ้น, ถ้าไม่มี id = อ่านทั้งหมด
      const endpoint = id
        ? `${baseURL}/data_service/notifications/read/${id}`
        : `${baseURL}/data_service/notifications/read-all`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: getAuthHeader()
      });

      if (res.ok) {
        // อัปเดตข้อมูลในหน้านี้
        fetchNotifications();
        // 🔴 ส่งสัญญาณไปที่ Layout.jsx เพื่อให้จุดแดงหายไปทันที
        window.dispatchEvent(new Event("refreshBadges"));
      }
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  return (
    <div className="notification-page-container">
      <div className="notification-card-central">
        <div className="notification-header">
          <div className="title-group">
            <h1>การแจ้งเตือน</h1>
            {unreadCount > 0 && <span className="unread-badge">{unreadCount} ใหม่</span>}
          </div>
          {unreadCount > 0 && (
            <button className="btn-mark-all" onClick={() => handleMarkAsRead()}>
              ทำเป็นอ่านแล้วทั้งหมด
            </button>
          )}
        </div>

        <hr className="divider" />

        {loading ? (
          <div className="loading-state">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map((noti) => (
                <div
                  key={noti.id}
                  className={`notification-item ${noti.is_read ? 'read' : 'unread'}`}
                  onClick={() => !noti.is_read && handleMarkAsRead(noti.id)}
                >
                  <div className="noti-icon-wrapper">
                    <div className={`icon-circle ${noti.type.toLowerCase()}`}>
                      {/* เลือกไอคอนตามประเภทแจ้งเตือน */}
                      {noti.type === 'QUEUE' ? '📅' : noti.type === 'SYSTEM' ? '⚙️' : '🔔'}
                    </div>
                  </div>

                  <div className="noti-info">
                    <div className="noti-top">
                      <h3 className="noti-title">{noti.title}</h3>
                      <span className="noti-time">
                        {new Date(noti.create_at).toLocaleString('th-TH', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="noti-message">{noti.message}</p>
                  </div>

                  {!noti.is_read && <div className="unread-dot-indicator"></div>}
                </div>
              ))
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '50px', marginBottom: '10px', opacity: 0.5 }}>🔔</div>
                <p>ยังไม่มีการแจ้งเตือนในขณะนี้</p>
                <button
                  onClick={() => navigate("/")}
                  style={{ marginTop: '15px', color: '#d35400', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  กลับหน้าหลัก
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}