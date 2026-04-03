import { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { DataContext } from "../DataContext";

export default function RequireRole({ allowRoles }) {
    // ดึง role จากระบบ
    const { role } = useContext(DataContext) || {};

    // แปลง role ให้เป็นตัวใหญ่ (ป้องกันบั๊กพิมพ์เล็ก-พิมพ์ใหญ่)
    const currentRole = role ? role.toUpperCase() : "";

    // ถ้า role ของคนที่ล็อกอิน ตรงกับ role ที่อนุญาต ให้แสดงเนื้อหาหน้าเว็บ (Outlet)
    // แต่ถ้าไม่ใช่ ให้เด้งกลับไปหน้าแรก (/)
    return allowRoles.includes(currentRole) ? <Outlet /> : <Navigate to="/" replace />;
}