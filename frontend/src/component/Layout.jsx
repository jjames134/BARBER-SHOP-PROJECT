import { Outlet, useNavigate, useLocation } from "react-router-dom"
import { useContext, useState, useRef, useEffect, useCallback } from "react"
import { DataContext } from "../DataContext"
import "./style/Layout.css" 

export default function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const { role, islogin, handleLogout, username, profileImg, baseURL } = useContext(DataContext)
  
  const currentRole = role ? role.toUpperCase() : '';
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); 
  const [unreadCount, setUnreadCount] = useState(0);        // จำนวนแจ้งเตือนที่ยังไม่ได้อ่าน
  const [pendingLeaveCount, setPendingLeaveCount] = useState(0); // จำนวนใบลาที่รออนุมัติ (สำหรับ Owner)
  const popupRef = useRef();

  // --- 🔄 ฟังก์ชันดึงจำนวน Badge (แจ้งเตือน & ใบลา) ---
  const fetchBadges = useCallback(async () => {
    if (!islogin || !baseURL) return;
    try {
      const headers = { 
        "Authorization": `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "application/json"
      };
      
      // 1. ดึงข้อมูลจาก Notification (data_service)
      const resNoti = await fetch(`${baseURL}/data_service/notifications`, { headers });
      if (resNoti.ok) {
        const data = await resNoti.json();
        // Backend ส่ง { items: [...], unread_count: X }
        setUnreadCount(data.unread_count || 0);
      }

      // 2. ถ้าเป็น OWNER ให้ดึงข้อมูลใบลามานับจำนวน PENDING
      if (currentRole === 'OWNER') {
        const resLeave = await fetch(`${baseURL}/barber_manage/leave_letter`, { headers });
        if (resLeave.ok) {
          const leaves = await resLeave.json();
          const pending = leaves.filter(l => l.status === 'PENDING').length;
          setPendingLeaveCount(pending);
        }
      }
    } catch (err) {
      console.error("Error fetching badge counts:", err);
    }
  }, [islogin, baseURL, currentRole]);

  // ตั้งค่าดึงข้อมูลครั้งแรก และดักฟัง Event การ Refresh
  useEffect(() => {
    fetchBadges();
    
    // ฟัง Event "refreshBadges" เพื่อให้หน้าลูกๆ สั่งให้จุดแดงอัปเดตได้ทันที
    window.addEventListener("refreshBadges", fetchBadges);
    
    // ตั้ง Interval เช็คทุกๆ 2 นาที (Optional)
    const interval = setInterval(fetchBadges, 120000);
    
    return () => {
      window.removeEventListener("refreshBadges", fetchBadges);
      clearInterval(interval);
    };
  }, [fetchBadges]);

  // ตรวจจับการ Scroll สำหรับ Navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const onLogOutClick = () => {
    setIsPopupOpen(false);
    handleLogout();
    navigate("/login");
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsPopupOpen(false);
      }
    }
    if (isPopupOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPopupOpen]);

  const navigateTo = (path) => {
    setIsPopupOpen(false);
    navigate(path);
  }

  const renderNavProfileIcon = () => {
    if (!islogin) return <div className="text-gray-400 text-xl">👤</div>;
    const defaultImg = currentRole === 'OWNER' ? "/images/icon-owner.png" : 
                       currentRole === 'EMPLOYEE' ? "/images/icon-employee.png" : "/images/icon-customer.png";
    
    return (
      <img 
        src={profileImg ? `${baseURL}/${profileImg}` : defaultImg} 
        alt="Profile" 
        className="w-full h-full object-cover"
        onError={(e) => { e.target.src = "/images/icon-customer.png"; }}
      />
    );
  }

  const renderPopupMenuItems = () => {
    const menuItemClass = "popup-item relative flex items-center justify-between w-full"; 
    return (
      <div className="p-2 flex flex-col gap-1">
        <button onClick={() => navigateTo("/profile")} className="popup-item flex items-center">
           <img src="/images/icon-edit.png" alt="" className="w-4 h-4 mr-2" /> แก้ไขโปรไฟล์
        </button>

        {/* --- การแจ้งเตือน + จุดแดง --- */}
        <button onClick={() => navigateTo("/notification")} className={menuItemClass}>
           <div className="flex items-center">
             <img src="/images/icon-bell.png" alt="" className="w-4 h-4 mr-2" /> การแจ้งเตือน
           </div>
           {unreadCount > 0 && <span className="badge-count-red">{unreadCount}</span>}
        </button>

        {currentRole === 'EMPLOYEE' && (
          <button onClick={() => navigateTo("/leave-letter")} className="popup-item flex items-center">
             <img src="/images/icon-leave.png" alt="" className="w-4 h-4 mr-2" /> แจ้งลา
          </button>
        )}

        {currentRole === 'OWNER' && (
          <>
            <button onClick={() => navigateTo("/dashboard")} className="popup-item flex items-center">
               <img src="/images/icon-chart.png" alt="" className="w-4 h-4 mr-2" /> ดูกราฟผลประกอบการ
            </button>
            
            {/* --- จัดการร้าน + จุดแดง (ถ้ามีใบลาค้าง) --- */}
            <button onClick={() => navigateTo("/manage-user")} className={menuItemClass}>
               <div className="flex items-center">
                 <img src="/images/icon-users.png" alt="" className="w-4 h-4 mr-2" /> จัดการร้าน
               </div>
               {pendingLeaveCount > 0 && <span className="badge-count-orange">ใบลา {pendingLeaveCount}</span>}
            </button>

            <button onClick={() => navigateTo("/custom-web")} className="popup-item flex items-center">
               <img src="/images/icon-web.png" alt="" className="w-4 h-4 mr-2" /> ปรับแต่งเว็บไซต์
            </button>
            <button onClick={() => navigateTo("/shop-setting")} className="popup-item flex items-center">
               <img src="/images/icon-setting.png" alt="" className="w-4 h-4 mr-2" /> จัดการคิว & สถานะร้าน
            </button>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#fffcf7] relative">
      
      {/* --- Navbar --- */}
      <header className={`fixed top-0 w-full z-[100] transition-all duration-300 ${
        isScrolled ? "bg-white/90 backdrop-blur-md shadow-md h-16" : "bg-[#F6DBB8] h-20"
      }`}>
        <div className="max-w-7xl mx-auto h-full px-6 flex justify-between items-center">
          <div className="flex-1">
            <div className="cursor-pointer group w-fit" onClick={() => navigate("/")}>
               <img src="/images/logo-barber.png" alt="Logo" className="h-10 md:h-12 w-auto group-hover:scale-105 transition-transform" />
            </div>
          </div>

          <nav className="flex-2 hidden md:flex items-center gap-6">
            <button onClick={() => navigate("/")} className={`nav-link ${location.pathname === "/" ? "active" : ""}`}>หน้าแรก</button>
            <span className="text-gray-300">|</span>
            <button 
              onClick={() => navigate(currentRole === 'EMPLOYEE' || currentRole === 'OWNER' ? "/working-table" : "/chair")} 
              className={`nav-link ${location.pathname.includes("table") || location.pathname === "/chair" ? "active" : ""}`}
            >
              จองคิว
            </button>
            {(!islogin || currentRole === 'CUSTOMER') && (
              <>
                <span className="text-gray-300">|</span>
                <button onClick={() => navigate(!islogin ? "/login" : "/booked-table")} className={`nav-link ${location.pathname === "/booked-table" ? "active" : ""}`}>สถานะคิว</button>
              </>
            )}
          </nav>

          <div className="flex-1 flex justify-end items-center gap-4 relative">
            {!islogin ? (
              <button onClick={() => navigate("/login")} className="btn-login-new">ลงชื่อเข้าใช้</button>
            ) : (
              <div onClick={() => setIsPopupOpen(!isPopupOpen)} className={`user-profile-trigger relative ${isPopupOpen ? 'active' : ''}`}>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white">
                  {renderNavProfileIcon()}
                </div>
                
                {/* 🔴 จุดแดงแจ้งเตือนหลักบน Navbar Profile */}
                {(unreadCount > 0 || pendingLeaveCount > 0) && (
                  <span className="nav-red-dot-pulse"></span>
                )}
                
                <span className="hidden lg:block font-bold text-gray-700 text-sm ml-2">{username}</span>
              </div>
            )}

            {islogin && isPopupOpen && (
              <div ref={popupRef} className="nav-popup-new animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-gray-50 flex items-center gap-3 bg-gradient-to-br from-orange-50/50 to-transparent">
                   <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm bg-white">{renderNavProfileIcon()}</div>
                   <div className="flex flex-col text-left">
                      <span className="font-bold text-gray-800 leading-tight truncate max-w-[120px]">{username}</span>
                      <span className="text-[10px] text-orange-600 font-bold uppercase tracking-widest mt-1 bg-orange-100 px-2 py-0.5 rounded-full w-fit">
                        {role}
                      </span>
                   </div>
                </div>
                {renderPopupMenuItems()}
                <div className="p-2 border-t border-gray-50">
                  <button onClick={onLogOutClick} className="popup-item-logout">
                      <img src="/images/icon-logout.png" alt="" className="w-4 h-4 mr-2" /> ออกจากระบบ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className={`flex-grow transition-all duration-300 ${isScrolled ? 'mt-16' : 'mt-20'}`}>
        <Outlet />
      </main>

      {/* --- Footer --- */}
      <footer className="bg-[#5D4037] text-white py-10 px-8 md:px-24 flex flex-col md:flex-row justify-between items-start gap-8 z-30 relative">
        <div>
          <h3 className="font-bold mb-3 text-lg flex items-center gap-2">
             <img src="/images/icon-location-white.png" alt="location" className="w-6 h-6 object-contain" /> ที่อยู่ร้าน
          </h3>
          <p className="text-sm text-gray-200">120/8 หมู่บ้านร่มฟ้า วิลเลจ<br/>วรานคร 22310</p>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-lg">ช่องทางติดต่อ</h3>
          <p className="text-sm text-gray-200 flex items-center gap-2 mb-1">
             <img src="/images/icon-chat-white.png" alt="chat" className="w-5 h-5 object-contain" /> Barbershop123
          </p>
          <p className="text-sm text-gray-200 flex items-center gap-2">
             <img src="/images/icon-phone-white.png" alt="phone" className="w-5 h-5 object-contain" /> 020-123-4567
          </p>
        </div>
        <div>
          <h3 className="font-bold mb-3 text-lg flex items-center gap-2">
             <img src="/images/icon-clock-white.png" alt="clock" className="w-6 h-6 object-contain" /> เปิดบริการทุกวัน
          </h3>
          <p className="text-xl text-gray-200">10:00 น. - 20:00 น.</p>
        </div>
      </footer>
    </div>
  )
}