import { Outlet, useNavigate } from "react-router-dom"
import { useState,useContext,useEffect } from "react"
import { DataContext } from "../DataContext"


export default function Layout() {
  const navigate = useNavigate()
  const { role, islogin, setIsLogin } = useContext(DataContext)
  const handleLogOut = () =>{
    localStorage.clear()
    localStorage.setItem("islogin",false)
    setIsLogin(false) 
  }
  

  return (
    <>
      <header className="header-Home">
        <div>
          <h1>LOGO</h1>
        </div>

        <div className="tapbar" style={{ flexGrow: 1 }}>
          <button className="tap" onClick={() => navigate("/")}>Home</button>
          <div>|</div>
          <button className="tap" onClick={() => navigate("/chair")}>Queue</button>
          <div>|</div>
          <button className="tap" onClick={() => navigate("/view-queue")}>View Queue</button>
        </div>

        <div>
          {islogin
            ? <div><button onClick={() => handleLogOut() }>Logout</button>
            <button>Icon</button></div>  
            : <button onClick={() => navigate("/login")}>Login</button>        
          }
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer-Home">
        <div>
          <h3>Address:</h3>
          <div>ที่อยู่</div>
        </div>

        <div>
          <h3>Contact:</h3>
          <div>ติดต่อ</div>
        </div>

        <div>
          <h3>Open Time:</h3>
          <div>เวลาเปิดปิด</div>
        </div>
      </footer>
    </>
  )
}