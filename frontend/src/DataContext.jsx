import { createContext, useState, useEffect } from "react"
import { jwtDecode } from "jwt-decode"

export const DataContext = createContext()

export function DataProvider({ children }) {
  const [role, setRole] = useState(null)
  const [islogin, setIsLogin] = useState(false)
  const [userId, setUserId] = useState(null)

  useEffect(()=>{
    const token = localStorage.getItem("token")
    if(token){
         const decoded = jwtDecode(token)
         setRole(decoded.role)
         setUserId(decoded.user_id)
         setIsLogin(true)
    }
  },[])

  return (
    <DataContext.Provider value={{  role, userId, islogin, setRole, setIsLogin }}>
        {children}
    </DataContext.Provider>
  )
}