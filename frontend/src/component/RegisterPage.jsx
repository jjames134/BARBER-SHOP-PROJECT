import { Form, useNavigate } from "react-router-dom"
import { useState } from "react"



export default function RegisterPage(){
    const navigate = useNavigate()
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [firstname, setFirstname] = useState("")
    const [lastname, setLastname] = useState("")
    const [birthday, setBirthday] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [faillenmessage, setFaillenMessage] = useState("")

    async function submitRegister(e) {
        e.preventDefault()

        if (!username || !password || !firstname || !birthday || !email || !phone) {
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
                    birthday,
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
        <form className="container-page1" onSubmit={submitRegister}>

            <h2>Register</h2>

            <span>{faillenmessage}</span>

            <div className="container-login">

                <label>Username</label>
                <input onChange={(e) => setUsername(e.target.value)} />

                <label>Password</label>
                <input type="password" onChange={(e) => setPassword(e.target.value)} />

                <label>Firstname</label>
                <input onChange={(e) => setFirstname(e.target.value)} />

                <label>Lastname</label>
                <input onChange={(e) => setLastname(e.target.value)} />

                <label>Birthday</label>
                <input type="date" onChange={(e) => setBirthday(e.target.value)} />

                <label>Email</label>
                <input type="email" onChange={(e) => setEmail(e.target.value)} />

                <label>Phone</label>
                <input onChange={(e) => setPhone(e.target.value)} />

            </div>

            <button type="submit">
                Register
            </button>

        </form>
    )
}