import { Form, useNavigate } from "react-router-dom"
import { useState } from "react"



export default function RegisterPage() {
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [passcheck, setPasscheck] = useState("")
    const [firstname, setFirstname] = useState("")
    const [lastname, setLastname] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [faillenmessage, setFaillenMessage] = useState("")

    async function submitRegister(e) {
        e.preventDefault()

        if (!username || !password || !firstname || !email || !phone) {
            setFaillenMessage("กรุณากรอกข้อมูลให้ครบ")
            return
        }

        try {

            const res = await fetch("http://localhost:8000/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username,
                    password,
                    firstname,
                    lastname,
                    email,
                    phone
                })
            })

            const data = await res.json()

            if (res.ok) {
                alert("Register success")
                navigate("/login")
            } else {
                setFaillenMessage(data.detail)
            }

        } catch (err) {
            setFaillenMessage("Server Error")
        }
    }

    return (
        <form className="register-page" onSubmit={submitRegister}>

            <div className="register-card">

                <h2>สร้างบัญชีผู้ใช้</h2>

                <span className="error">{faillenmessage}</span>

                <div className="row">
                    <div className="input-group">
                        <label>ชื่อ</label>
                        <input onChange={(e) => setFirstname(e.target.value)} placeholder="โปรดป้อนชื่อ" />
                    </div>

                    <div className="input-group">
                        <label>นามสกุล</label>
                        <input onChange={(e) => setLastname(e.target.value)} placeholder="โปรดป้อนนามสกุล" />
                    </div>
                </div>

                <div className="input-group">
                    <label>ชื่อบัญชีผู้ใช้</label>
                    <input onChange={(e) => setUsername(e.target.value)} />
                </div>

                <div className="input-group">
                    <label>หมายเลขโทรศัพท์</label>
                    <input onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="input-group">
                    <label>อีเมล</label>
                    <input type="email" onChange={(e) => setEmail(e.target.value)} />
                </div>

                <div className="input-group">
                    <label>รหัสผ่าน</label>
                    <input type="password" onChange={(e) => setPassword(e.target.value)} />
                </div>

                <div className="input-group">
                    <label>ยืนยันรหัสผ่าน</label>
                    <input type="password" onChange={(e) => setPasscheck(e.target.value)} />
                </div>

                <button className="register-btn">
                    สร้างบัญชีผู้ใช้
                </button>

            </div>

        </form>
    )
}