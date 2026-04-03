import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { DataContext } from "../DataContext";
import Swal from "sweetalert2";
// อย่าลืมเปลี่ยนมาใช้ไฟล์ CSS ใหม่นี้นะครับ
import "./style/EditProfilePage.css"; 

export default function EditProfilePage() {
  const navigate = useNavigate();
  const { baseURL, fetchUserData } = useContext(DataContext); // ดึง fetchUserData มาใช้
  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    currentPassword: "",
    profileImg: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1. ดึงข้อมูลโปรไฟล์ปัจจุบัน (เหมือนเดิม)
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${baseURL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setForm({
            username: data.username,
            firstName: data.firstname || "",
            lastName: data.lastname || "",
            phone: data.phone || "",
            profileImg: data.profile_img || "",
          });
          if (data.profile_img) {
            setPreviewUrl(`${baseURL}/${data.profile_img}`);
          }
        }
      } catch (err) {
        console.error("Fetch profile error:", err);
      }
    };
    fetchProfile();
  }, [baseURL, token]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 2. จัดการเปลี่ยนรูปภาพ (เหมือนเดิม)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 3. กดยืนยันการบันทึก (เหมือนเดิม + ปรับ Swal เล็กน้อย)
  const handleConfirmSave = async () => {
    setLoading(true);
    try {
      // --- STEP 1: Verify Password ---
      const verifyRes = await fetch(`${baseURL}/auth/verify_owner_password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: form.currentPassword }),
      });

      if (!verifyRes.ok) throw new Error("รหัสผ่านไม่ถูกต้อง");

      let finalImagePath = form.profileImg;
      // --- STEP 2: Upload Image ---
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadRes = await fetch(`${baseURL}/data_service/upload_profile_img`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImagePath = uploadData.path;
        }
      }

      // --- STEP 3: Update Info ---
      const updateRes = await fetch(`${baseURL}/auth/edit_info`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: form.username,
          firstname: form.firstName,
          lastname: form.lastName,
          phone: form.phone,
          profile_img: finalImagePath,
        }),
      });

      if (updateRes.ok) {
        setShowPasswordConfirm(false);
        setForm((prev) => ({ ...prev, currentPassword: "" }));
        await fetchUserData(); // 🌟 เรียกฟังก์ชันนี้เพื่อให้ Navbar และ Profile ทั่วเว็บอัปเดตทันที
        Swal.fire({ 
            icon: "success", 
            title: "สำเร็จ", 
            text: "อัปเดตข้อมูลเรียบร้อยแล้ว",
            confirmButtonColor: "#f39c12" // สีส้มบาร์เบอร์
        });
        navigate("/profile");
      } else {
        const errData = await updateRes.json();
        throw new Error(errData.detail || "อัปเดตล้มเหลว");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "ผิดพลาด", text: err.message, confirmButtonColor: "#d33" });
    } finally {
      setLoading(false);
    }
  };

  // --- ส่วน JSX ที่ปรับโครงสร้างใหม่ ---
  return (
    <div className="ep-container">
      {/* แถบหัวข้อบนสุด */}
      <header className="ep-header">
        <button type="button" className="ep-back-btn" onClick={() => navigate(-1)}>
          ← ย้อนกลับ
        </button>
        <h1>ตั้งค่าโปรไฟล์</h1>
        <div className="header-space"></div> {/* เพื่อจัดกึ่งกลาง h1 */}
      </header>

      <main className="ep-main-content">
        <section className="ep-card">
          {/* ส่วนอัปโหลดรูปภาพ */}
          <div className="ep-avatar-section">
            <div className="ep-avatar-wrapper">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="ep-avatar-img" 
                  onError={(e) => { e.target.src = "https://placehold.co/150?text=Error"; }}/>
              ) : (
                <div className="ep-avatar-placeholder">👤</div>
              )}
              <label className="ep-upload-circle" title="เปลี่ยนรูปโปรไฟล์">
                📷
                <input type="file" hidden onChange={handleFileChange} accept="image/*" />
              </label>
            </div>
            <p className="ep-avatar-tip">แนะนำ: รูปสี่เหลี่ยมจัตุรัส ขนาดไม่เกิน 2MB</p>
          </div>

          {/* ฟอร์มข้อมูล */}
          <form className="ep-form" onSubmit={(e) => e.preventDefault()}>
            <div className="ep-form-grid">
              <div className="ep-input-group">
                <label>ชื่อ</label>
                <input type="text" value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} placeholder="กรอกชื่อจริง" />
              </div>
              <div className="ep-input-group">
                <label>นามสกุล</label>
                <input type="text" value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} placeholder="กรอกนามสกุล" />
              </div>
            </div>

            <div className="ep-input-group">
              <label>ชื่อบัญชีผู้ใช้ (Username)</label>
              <input type="text" value={form.username} onChange={(e) => handleChange("username", e.target.value)} className="ep-username-input" placeholder="example_user" />
            </div>

            <div className="ep-input-group">
              <label>หมายเลขโทรศัพท์</label>
              <input type="tel" value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} placeholder="0xx-xxxxxxx" />
            </div>

            {/* ปุ่มดำเนินการ */}
            <div className="ep-action-btns">
              <button type="button" className="ep-btn-secondary" onClick={() => navigate("/change-password")}>
                🔒 เปลี่ยนรหัสผ่าน
              </button>
              <button type="button" className="ep-btn-primary" onClick={() => setShowPasswordConfirm(true)}>
                💾 บันทึกการเปลี่ยนแปลง
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* Modal ยืนยันรหัสผ่าน - ปรับสไตล์ใหม่ */}
      {showPasswordConfirm && (
        <div className="ep-modal-overlay" onClick={() => !loading && setShowPasswordConfirm(false)}>
          <div className="ep-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ep-modal-header">
              <h3>ยืนยันตัวตน</h3>
              <button className="ep-modal-close" onClick={() => setShowPasswordConfirm(false)}>×</button>
            </div>
            <div className="ep-modal-body">
              <p>กรุณากรอกรหัสผ่านปัจจุบันของคุณ เพื่อยืนยันการแก้ไขข้อมูล</p>
              <div className="ep-input-group">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.currentPassword}
                  onChange={(e) => handleChange("currentPassword", e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="ep-modal-footer">
              <button className="ep-btn-cancel" onClick={() => setShowPasswordConfirm(false)} disabled={loading}>
                ยกเลิก
              </button>
              <button className="ep-btn-confirm" onClick={handleConfirmSave} disabled={loading}>
                {loading ? <span className="spinner"></span> : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}