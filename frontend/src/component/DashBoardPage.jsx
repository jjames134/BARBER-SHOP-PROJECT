import { useNavigate } from "react-router-dom"
import { useState, useRef, useContext, useEffect } from "react"
import { DataContext } from "../DataContext"
import "./style/DashBoardPage.css"

const BASE_URL = "http://localhost:8000" // adjust as needed

const STATUS_COLORS = {
  booked: "#E07B54",
  available: "#6DBF8C",
  checkin: "#5B9BD5",
  complete: "#A78BFA",
}

const STATUS_LABELS = {
  booked: "จองแล้ว",
  available: "ว่าง",
  checkin: "เช็คอิน",
  complete: "เสร็จสิ้น",
}

function StatCard({ icon, label, value, sub, subLabel, color, delay = 0 }) {
  return (
    <div className="db-stat-card" style={{ animationDelay: `${delay}ms` }}>
      <div className="db-stat-icon" style={{ background: color + "22", color }}>
        {icon}
      </div>
      <div className="db-stat-body">
        <span className="db-stat-label">{label}</span>
        <span className="db-stat-value">{value ?? "—"}</span>
        {sub !== undefined && (
          <span className="db-stat-sub">
            <span className="db-stat-sub-dot" style={{ background: color }} />
            {subLabel}: <b>{sub}</b>
          </span>
        )}
      </div>
    </div>
  )
}

function DonutChart({ data, total }) {
  const size = 140
  const radius = 52
  const cx = size / 2
  const cy = size / 2
  const stroke = 18
  const circumference = 2 * Math.PI * radius

  let offset = 0
  const segments = Object.entries(data)
    .filter(([k]) => k !== "total")
    .map(([key, val]) => {
      const pct = total > 0 ? val / total : 0
      const dash = pct * circumference
      const seg = { key, val, pct, dash, offset }
      offset += dash
      return seg
    })

  return (
    <div className="db-donut-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#f0ece8" strokeWidth={stroke} />
        {segments.map((s) => (
          <circle
            key={s.key}
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={STATUS_COLORS[s.key] || "#ccc"}
            strokeWidth={stroke}
            strokeDasharray={`${s.dash} ${circumference - s.dash}`}
            strokeDashoffset={-s.offset + circumference * 0.25}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="db-donut-total-num">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" className="db-donut-total-lbl">
          ทั้งหมด
        </text>
      </svg>
      <div className="db-donut-legend">
        {segments.map((s) => (
          <div key={s.key} className="db-donut-legend-row">
            <span className="db-donut-dot" style={{ background: STATUS_COLORS[s.key] }} />
            <span className="db-donut-legend-label">{STATUS_LABELS[s.key]}</span>
            <span className="db-donut-legend-val">{s.val}</span>
            <span className="db-donut-legend-pct">({Math.round(s.pct * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BarChart({ data }) {
  const keys = Object.keys(data).filter((k) => k !== "total")
  const max = Math.max(...Object.values(data).filter((v) => typeof v === "number"), 1)
  return (
    <div className="db-bar-chart">
      {keys.map((k) => (
        <div key={k} className="db-bar-group">
          <div className="db-bar-track">
            <div
              className="db-bar-fill"
              style={{
                height: `${(data[k] / max) * 100}%`,
                background: STATUS_COLORS[k] || "#ccc",
              }}
            />
          </div>
          <span className="db-bar-val">{data[k]}</span>
          <span className="db-bar-key">{STATUS_LABELS[k] || k}</span>
        </div>
      ))}
    </div>
  )
}

function LeaveStatusRow({ label, val, color }) {
  return (
    <div className="db-leave-row">
      <span className="db-leave-dot" style={{ background: color }} />
      <span className="db-leave-label">{label}</span>
      <span className="db-leave-val">{val ?? "—"}</span>
    </div>
  )
}

export default function DashBoard() {
  const navigate = useNavigate()
  const [queues, setQueues] = useState(null)
  const [customers, setCustomers] = useState(null)
  const [barbers, setBarbers] = useState(null)
  const [letters, setLetters] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const today = new Date()
  const dateStr = today.toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const [q, c, b, l] = await Promise.all([
          fetch(`${BASE_URL}/num_queues`).then((r) => r.json()),
          fetch(`${BASE_URL}/num_customer`).then((r) => r.json()),
          fetch(`${BASE_URL}/num_barber`).then((r) => r.json()),
          fetch(`${BASE_URL}/num_letter`).then((r) => r.json()),
        ])
        setQueues(q)
        setCustomers(c)
        setBarbers(b)
        setLetters(l)
      } catch (e) {
        setError("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <div className="db-root">
      {/* Header */}
      <header className="db-header">
        <button className="db-back-btn" onClick={() => navigate(-1)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <div className="db-header-text">
          <h1 className="db-title">Dashboard</h1>
          <span className="db-date">{dateStr}</span>
        </div>
        <button className="db-refresh-btn" onClick={() => window.location.reload()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        </button>
      </header>

      {loading && (
        <div className="db-loading">
          <div className="db-spinner" />
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      )}
      {error && <div className="db-error">{error}</div>}

      {!loading && !error && (
        <main className="db-main">

          {/* Stat Cards Row */}
          <section className="db-stat-row">
            <StatCard
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              label="คิวทั้งหมด" value={queues?.total}
              sub={queues?.checkin} subLabel="กำลังให้บริการ"
              color="#E07B54" delay={0}
            />
            <StatCard
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
              label="ลูกค้าทั้งหมด" value={customers?.total_customers}
              sub={customers?.active_customers} subLabel="กำลังใช้บริการ/รอ"
              color="#5B9BD5" delay={80}
            />
            <StatCard
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              label="ช่างทั้งหมด" value={barbers?.total_barbers}
              sub={barbers?.working_now} subLabel="กำลังทำงาน"
              color="#6DBF8C" delay={160}
            />
            <StatCard
              icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
              label="ใบลาวันนี้" value={letters?.today_total}
              sub={letters?.pending} subLabel="รอพิจารณา"
              color="#A78BFA" delay={240}
            />
          </section>

          {/* Queue Section */}
          <section className="db-section db-queue-section">
            <div className="db-section-header">
              <h2 className="db-section-title">สถานะคิว</h2>
              <span className="db-section-badge">{queues?.total} คิว</span>
            </div>
            <div className="db-queue-inner">
              {queues && (
                <>
                  <DonutChart data={queues} total={queues.total} />
                  <div className="db-bar-outer">
                    <h3 className="db-bar-title">สัดส่วนแต่ละสถานะ</h3>
                    <BarChart data={queues} />
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Bottom Row */}
          <div className="db-bottom-row">
            {/* Barber Card */}
            <section className="db-section db-barber-section">
              <div className="db-section-header">
                <h2 className="db-section-title">ช่างตัดผม</h2>
              </div>
              <div className="db-barber-grid">
                <div className="db-barber-item" style={{ background: "#6DBF8C22" }}>
                  <span className="db-barber-num" style={{ color: "#6DBF8C" }}>{barbers?.total_barbers ?? "—"}</span>
                  <span className="db-barber-lbl">ช่างทั้งหมด</span>
                </div>
                <div className="db-barber-item" style={{ background: "#5B9BD522" }}>
                  <span className="db-barber-num" style={{ color: "#5B9BD5" }}>{barbers?.working_now ?? "—"}</span>
                  <span className="db-barber-lbl">กำลังทำงาน</span>
                </div>
                <div className="db-barber-item" style={{ background: "#E07B5422" }}>
                  <span className="db-barber-num" style={{ color: "#E07B54" }}>{barbers?.on_leave_today ?? "—"}</span>
                  <span className="db-barber-lbl">ลาวันนี้</span>
                </div>
              </div>
            </section>

            {/* Leave Letter Card */}
            <section className="db-section db-leave-section">
              <div className="db-section-header">
                <h2 className="db-section-title">ใบลาวันนี้</h2>
                <span className="db-section-badge">{letters?.today_total ?? 0} ใบ</span>
              </div>
              <div className="db-leave-list">
                <LeaveStatusRow label="อนุมัติแล้ว" val={letters?.approved} color="#6DBF8C" />
                <LeaveStatusRow label="ไม่อนุมัติ" val={letters?.rejected} color="#E07B54" />
                <LeaveStatusRow label="รอพิจารณา" val={letters?.pending} color="#F5C842" />
              </div>
              {letters && letters.today_total > 0 && (
                <div className="db-leave-bar">
                  {["approved", "rejected", "pending"].map((k) => {
                    const colors = { approved: "#6DBF8C", rejected: "#E07B54", pending: "#F5C842" }
                    const pct = letters.today_total > 0 ? (letters[k] / letters.today_total) * 100 : 0
                    return pct > 0 ? (
                      <div
                        key={k}
                        className="db-leave-bar-seg"
                        style={{ width: `${pct}%`, background: colors[k] }}
                        title={`${k}: ${letters[k]}`}
                      />
                    ) : null
                  })}
                </div>
              )}
            </section>
          </div>

        </main>
      )}
    </div>
  )
}