import { Routes, Route } from "react-router-dom"
import Home from './component/Home' 
import Login from './component/LoginPage' 
import ChairPage from "./component/SelectChairPage"
import Register from "./component/RegisterPage"
import BookedTable from "./component/ViewBookedPage"
import ManageUser from "./component/ManageUser"
import RequireRole from "./component/RequireRole"
import DashBoard from "./component/DashBoardPage"
import ResetPassword from "./component/ResetPasswordPage"
import WorkTable from "./component/WorkTablePage"
import QueuesPage from "./component/queuesPage"
import Shopsetting from "./component/ShopSetting"
import CustomWeb from "./component/CustomWebPage"
import Notification from "./component/NotificationPage"
import EditProfilePage from "./component/EditProfilePage"
import LeaveLetter from "./component/LeaveLetterPage"
import LeaveDetailPage from "./component/LeaveDetailPage"
import ChangePasswordPage from "./component/ChangePasswordPage"
import ProfilePage from "./component/ProfilePage"
import './App.css'
import Layout from "./component/Layout"

function App() {
  return (
    <Routes>
      {/* 1. Route นอก Layout (ถ้ามี) */}
      <Route path="/test-manage-user" element={<ManageUser />} />

      {/* 2. Group ที่ใช้ Layout ร่วมกัน (มี Navbar/Footer) */}
      <Route element={<Layout />}>
        {/* --- Public Routes (ใครก็เข้าได้) --- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        
        {/* --- General Protected Routes (ต้อง Login ก่อน) --- */}
        <Route path="/chair" element={<ChairPage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route path="/booking/:chairId" element={<QueuesPage />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/leave-detail/:id" element={<LeaveDetailPage />} />
        <Route path="/profile" element={<ProfilePage/>}  />

        {/* --- Role: CUSTOMER เท่านั้น --- */}
        <Route element={<RequireRole allowRoles={["CUSTOMER"]} />}>
          <Route path="/booked-table" element={<BookedTable />} />
        </Route>

        {/* --- Role: EMPLOYEE เท่านั้น --- */}
        <Route element={<RequireRole allowRoles={["EMPLOYEE"]} />}>
          <Route path="/leave-letter" element={<LeaveLetter />} />
        </Route>

        {/* --- Role: EMPLOYEE และ OWNER --- */}
        <Route element={<RequireRole allowRoles={["EMPLOYEE", "OWNER"]} />}>
          <Route path="/working-table" element={<WorkTable />} />
        </Route>

        {/* --- Role: OWNER เท่านั้น --- */}
        <Route element={<RequireRole allowRoles={["OWNER"]} />}>
          <Route path="/dashboard" element={<DashBoard />} />
          <Route path="/manage-user" element={<ManageUser />} />
          <Route path="/custom-web" element={<CustomWeb />} />
          <Route path="/shop-setting" element={<Shopsetting />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App