import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../DataContext"; 
import Swal from "sweetalert2";
import "./style/ProfilePage.css";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { baseURL } = useContext(DataContext);
  const token = localStorage.getItem("token");

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    username: "",
    email: "",
    phone: "",
    profileImg: "",
  });

  const [loading, setLoading] = useState(true);

  // ดึงข้อมูล Profile มาแสดง
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${baseURL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser({
            firstName: data.firstname || "ไม่ระบุ",
            lastName: data.lastname || "ไม่ระบุ",
            username: data.username,
            email: data.email || "ไม่ระบุ",
            phone: data.phone || "ไม่ระบุ",
            profileImg: data.profile_img,
          });
        } else {
          // ถ้า Token หมดอายุ หรือหาโปรไฟล์ไม่เจอ
          Swal.fire("เซสชั่นหมดอายุ", "กรุณาเข้าสู่ระบบใหม่", "warning");
          navigate("/login");
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [baseURL, token, navigate]);

  if (loading) {
    return <div className="loading-screen">กำลังโหลดข้อมูล...</div>;
  }

  return (
    <div className="profile-page-container">
      {/* ปุ่มย้อนกลับ */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← ย้อนกลับ
      </button>

      <main className="profile-card">
        <div className="profile-header">
          <h2>โปรไฟล์ส่วนตัว</h2>
        </div>

        <section className="profile-content">
          {/* ส่วนรูปภาพ */}
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {user.profileImg ? (
                <img
                  src={`${baseURL}/${user.profileImg}`}
                  alt="Profile"
                  onError={(e) => {
                    e.target.src = "https://placehold.co/150?text=User";
                  }}
                />
              ) : (
                <span className="default-icon">👤</span>
              )}
            </div>
          </div>

          {/* รายละเอียดข้อมูล */}
          <div className="profile-info-grid">
            <div className="info-item">
              <label>ชื่อ - นามสกุล</label>
              <p>{`${user.firstName} ${user.lastName}`}</p>
            </div>

            <div className="info-item">
              <label>ชื่อผู้ใช้งาน (Username)</label>
              <p>@{user.username}</p>
            </div>

            <div className="info-item">
              <label>อีเมล (Email)</label>
              <p>{user.email}</p>
            </div>

            <div className="info-item">
              <label>เบอร์โทรศัพท์</label>
              <p>{user.phone}</p>
            </div>
          </div>

          {/* ปุ่มกดไปหน้าแก้ไข */}
          <div className="profile-actions">
            <button 
              className="edit-profile-btn" 
              onClick={() => navigate("/edit-profile")}
            >
              แก้ไขข้อมูลส่วนตัว
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}