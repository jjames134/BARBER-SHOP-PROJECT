import { useNavigate } from "react-router-dom"
import { useState, useRef,useContext  } from "react"
import { DataContext } from "../DataContext"
import "./style/LoginPage.css"


export default function Login() {
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassWord] = useState('')
    const [faillenmessage, setFaillenMessage] = useState("")
    const { setId, setRole, setIsLogin } = useContext(DataContext)
    async function submitLogin(e) {
        e.preventDefault()
        if ((!username || !password)) {
            console.log("กรุณากรอกusernameและpasswordให้ครบถ้วน")
            setFaillenMessage("กรุณากรอกusernameและpasswordให้ครบถ้วน")
        }
        else {
            try {
                const res = await fetch("http://localhost:8000/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                })
                const data = await res.json()
                if (res.ok) {
                    setFaillenMessage("")
                    localStorage.setItem("token", data.access_token)
                    localStorage.setItem("role", data.role)
                    localStorage.setItem("islogin", "true")
                    setRole(data.role)
                    setIsLogin(true)
                    navigate("/")
                }
                else {
                    setFaillenMessage(data.detail)
                }
            }
            catch (err) {
                setFaillenMessage("Server Faillen")
            }

        }

    }
    return (
        <>
            <form className="container-page1" onSubmit={submitLogin}>
                <h2>
                    Login
                </h2>
                <span>{faillenmessage}</span>
                <div className="container-login">
                    <label >Username</label>
                    <input onChange={(e) => setUsername(e.target.value)} />
                    <label>Password</label>
                    <input type={"password"} onChange={(e) => setPassWord(e.target.value)} />
                </div>
                <div>
                    <button className="tap2" type="button" onClick={() => navigate("/register")}>
                        Register?
                    </button>
                    <button className="tap2" type="button" onClick={() => navigate("/reset-password")}>
                        Forgot Password?
                    </button>
                </div>
                <button type={"submit"} >
                    LOGIN
                </button>

            </form>
        </>
    )
}