import { Navigate, Outlet } from "react-router-dom"
import { useContext } from "react"
import { DataContext } from "../DataContext"
export default function RequireRole({ allowRoles }) {
  const { role, islogin } = useContext(DataContext)
  if (!islogin) { return <Navigate to="/login" replace /> }
  if
    (!allowRoles.includes(role)) { return <Navigate to="/" replace /> }
  return
  <Outlet />
}