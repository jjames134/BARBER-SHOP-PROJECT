import { useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { DataContext } from "../DataContext";
import "./style/ChangePasswordPage.css";

// --- EyeIcon: ไอคอนลูกตาสำหรับเปิด/ปิดการมองเห็นรหัสผ่าน ---
const EyeIcon = ({ open }) => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {open
      ? <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
      : <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
    }
  </svg>
);

// --- FieldRow: ส่วนประกอบของ Input แต่ละแถว ---
const FieldRow = ({ label, fieldKey, showKey, placeholder, value, onChange, showStatus, onToggleShow }) => (
  <div className="cp-field">
    <label className="cp-label">{label}</label>
    <div className="cp-input-wrap">
      <input
        className="cp-input"
        type={showStatus ? "text" : "password"}
        required
        value={value}
        onChange={e => onChange(fieldKey, e.target.value)}
        placeholder={placeholder}
      />
      <button type="button" className="cp-eye" onClick={() => onToggleShow(showKey)}>
        <EyeIcon open={showStatus} />
      </button>
    </div>
  </div>
);

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const { baseURL, fetchWithAuth } = useContext(DataContext);

  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ cur: false, nw: false, cf: false });

  // ✅ Validation Logic: ตรวจสอบเงื่อนไข 8 ตัวอักษรและรหัสผ่านตรงกัน
  const isPasswordShort = form.newPassword.length > 0 && form.newPassword.length < 8;
  const isMismatch = form.confirmPassword.length > 0 && form.newPassword !== form.confirmPassword;
  const isInvalid = form.newPassword.length < 8 || isMismatch || !form.currentPassword;

  const handleChange = (field, value) => {
    if (errorMsg) setErrorMsg("");
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const toggleShow = (key) => {
    setShow(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // คำนวณความแข็งแกร่งของรหัสผ่าน
  const strength = (pw) => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const pwStrength = strength(form.newPassword);
  const strengthLabel = ["", "อ่อน", "พอใช้", "ดี", "แข็งแกร่ง"][pwStrength];
  const strengthColor = ["", "#e07b54", "#e8b84b", "#6dbf8c", "#5b9bd5"][pwStrength];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.newPassword.length < 8) {
      setErrorMsg("รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setErrorMsg("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmChange = async () => {
    setShowConfirm(false);
    setLoading(true);
    setErrorMsg("");
    try {
      // ✅ ใช้ fetchWithAuth เพื่อความเสถียรของ Token
      const res = await fetchWithAuth(`${baseURL}/auth/change_password`, {
        method: "PATCH",
        body: JSON.stringify({ 
          old_password: form.currentPassword, 
          new_password: form.newPassword 
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowSuccess(true);
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setErrorMsg(data.detail || "เกิดข้อผิดพลาด");
      }
    } catch {
      setErrorMsg("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">
      <button className="cp-back" onClick={() => navigate(-1)}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        ย้อนกลับ
      </button>

      <div className="cp-center">
        <div className="cp-card">
          <div className="cp-icon-wrap">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 className="cp-title">เปลี่ยนรหัสผ่าน</h2>
          <p className="cp-sub">กรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่ที่ต้องการ</p>

          {errorMsg && (
            <div className="cp-error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <FieldRow 
              label="รหัสผ่านปัจจุบัน" 
              fieldKey="currentPassword" 
              showKey="cur" 
              placeholder="กรอกรหัสผ่านปัจจุบัน" 
              value={form.currentPassword}
              onChange={handleChange}
              showStatus={show.cur}
              onToggleShow={toggleShow}
            />

            <FieldRow 
              label="รหัสผ่านใหม่" 
              fieldKey="newPassword" 
              showKey="nw" 
              placeholder="ต้องมีอย่างน้อย 8 ตัวอักษร" 
              value={form.newPassword}
              onChange={handleChange}
              showStatus={show.nw}
              onToggleShow={toggleShow}
            />

            {/* ✅ แสดงแถบความแข็งแกร่งและแจ้งเตือนเรื่อง 8 ตัวอักษร */}
            {form.newPassword && (
              <div className="cp-strength-wrap">
                <div className="cp-bars">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="cp-bar"
                      style={{ background: i <= pwStrength ? strengthColor : 'var(--sand)' }} />
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span className="cp-strength-lbl" style={{ color: strengthColor }}>{strengthLabel}</span>
                  {isPasswordShort && <span style={{ color: '#e07b54', fontSize: '12px' }}>* ต่ำกว่า 8 ตัวอักษร</span>}
                </div>
              </div>
            )}

            <FieldRow 
              label="ยืนยันรหัสผ่านใหม่" 
              fieldKey="confirmPassword" 
              showKey="cf" 
              placeholder="กรอกซ้ำอีกครั้ง" 
              value={form.confirmPassword}
              onChange={handleChange}
              showStatus={show.cf}
              onToggleShow={toggleShow}
            />

            {form.confirmPassword && (
              <div className={`cp-match ${form.newPassword === form.confirmPassword ? 'ok' : 'fail'}`}>
                {form.newPassword === form.confirmPassword ? '✓ รหัสผ่านตรงกัน' : '✗ รหัสผ่านไม่ตรงกัน'}
              </div>
            )}

            {/* ✅ ปุ่ม Submit จะถูก Disable จนกว่าเงื่อนไขจะครบ */}
            <button 
              type="submit" 
              className={`cp-submit ${isInvalid ? 'cp-disabled' : ''}`} 
              disabled={loading || isInvalid}
            >
              {loading ? (
                <><span className="cp-spin"/>กำลังดำเนินการ...</>
              ) : isInvalid && form.newPassword ? (
                'ข้อมูลยังไม่ถูกต้อง'
              ) : (
                'เปลี่ยนรหัสผ่าน'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* --- Modal ยืนยัน --- */}
      {showConfirm && (
        <div className="cp-overlay" onClick={() => setShowConfirm(false)}>
          <div className="cp-modal" onClick={e => e.stopPropagation()}>
            <div className="cp-modal-emoji">🔑</div>
            <h3 className="cp-modal-title">ยืนยันการเปลี่ยนรหัสผ่าน?</h3>
            <p className="cp-modal-desc">รหัสผ่านเดิมจะถูกแทนที่ทันที</p>
            <div className="cp-modal-btns">
              <button className="cp-btn-ghost" onClick={() => setShowConfirm(false)}>ยกเลิก</button>
              <button className="cp-btn-gold" onClick={handleConfirmChange}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal สำเร็จ --- */}
      {showSuccess && (
        <div className="cp-overlay">
          <div className="cp-modal">
            <div className="cp-success-ring">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 className="cp-modal-title">เปลี่ยนรหัสผ่านสำเร็จ!</h3>
            <p className="cp-modal-desc">รหัสผ่านของคุณได้รับการอัปเดตแล้ว</p>
            <button className="cp-btn-gold" style={{width:'100%'}}
              onClick={() => { setShowSuccess(false); navigate(-1) }}>เสร็จสิ้น</button>
          </div>
        </div>
      )}
    </div>
  );
}