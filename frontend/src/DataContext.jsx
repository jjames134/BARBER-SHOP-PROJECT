import { createContext, useState, useEffect, useCallback } from "react";

export const DataContext = createContext();

export function DataProvider({ children }) {
    // --- 1. Auth State ---
    const [role, setRole] = useState(null);
    const [islogin, setIsLogin] = useState(false);
    const [userId, setUserId] = useState(null);
    const [username, setUsername] = useState("ชื่อผู้ใช้งาน");
    const [profileImg, setProfileImg] = useState("");
    const [userData, setUserData] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    // --- 2. Website Config State (Public) ---
    const [heroSlides, setHeroSlides] = useState([]);
    const [promoSlides, setPromoSlides] = useState([]);
    const [announcementText, setAnnouncementText] = useState("");

    // --- 3. Shop Status State (จัดการร้านค้า) ---
    const [shopOpenTime, setShopOpenTime] = useState("10:00:00");
    const [shopCloseTime, setShopCloseTime] = useState("15:00:00");
    const [shopStatus, setShopStatus] = useState("close"); // 'open' | 'close'

    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8000";

    // 🚪 ฟังก์ชันออกจากระบบ
    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        setRole(null);
        setUserId(null);
        setIsLogin(false);
        setUserData(null);
        setUsername("ชื่อผู้ใช้งาน");
        setProfileImg("");
    }, []);

    // 🔄 ฟังก์ชันขอ Token ใหม่ (Refresh Token)
    const refreshToken = useCallback(async () => {
        const rfToken = localStorage.getItem("refresh_token");
        if (!rfToken) return null;

        try {
            const response = await fetch(`${baseURL}/auth/refresh?refresh_token=${rfToken}`, {
                method: "POST",
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("refresh_token", data.refresh_token);
                console.log("✅ Refresh Token Success");
                return data.access_token;
            }
        } catch (err) {
            console.error("❌ Refresh token error:", err);
        }
        
        handleLogout(); 
        return null;
    }, [baseURL, handleLogout]);

    // 🛡️ ฟังก์ชัน Fetch กลาง (จัดการ 401 Unauthorized อัตโนมัติ)
    const fetchWithAuth = useCallback(async (url, options = {}) => {
        let token = localStorage.getItem("token");

        const getHeaders = (t) => ({
            "Content-Type": "application/json",
            ...options.headers,
            "Authorization": t ? `Bearer ${t}` : "",
        });

        let response = await fetch(url, { 
            ...options, 
            headers: getHeaders(token) 
        });

        if (response.status === 401) {
            console.warn("⚠️ Token expired, retrying...");
            const newToken = await refreshToken();
            if (newToken) {
                response = await fetch(url, { 
                    ...options, 
                    headers: getHeaders(newToken) 
                });
            }
        }
        return response;
    }, [refreshToken]);

    // 🔄 ฟังก์ชันดึงข้อมูล Profile
    const fetchUserData = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setAuthLoading(false);
            return;
        }

        try {
            const response = await fetchWithAuth(`${baseURL}/auth/profile`);
            if (response.ok) {
                const data = await response.json();
                setUserId(data.id);
                setUsername(data.username);
                setProfileImg(data.profile_img || "");
                setRole(data.rolestatus);
                setUserData(data);
                setIsLogin(true);
            } else {
                handleLogout();
            }
        } catch (err) {
            console.error("Fetch profile error:", err);
        } finally {
            setAuthLoading(false);
        }
    }, [baseURL, fetchWithAuth, handleLogout]);

    // 🏪 ฟังก์ชันดึงข้อมูลสถานะร้านค้า (ใช้ Update หน้าจอหลังบันทึก)
    const fetchShopData = useCallback(async () => {
        try {
            const response = await fetch(`${baseURL}/data_service/data_date`);
            if (response.ok) {
                const data = await response.json();
                setShopOpenTime(data.open_time || "10:00:00");
                setShopCloseTime(data.close_time || "15:00:00");
                setShopStatus(data.is_open ? "open" : "close");
                console.log("🏪 Shop Data Updated");
            }
        } catch (err) {
            console.error("Fetch shop data error:", err);
        }
    }, [baseURL]);

    // 🔄 ดึงข้อมูลรูปภาพและประกาศหน้าเว็บ
    const fetchWebsiteConfig = useCallback(async () => {
        try {
            const [imgRes, descRes] = await Promise.all([
                fetch(`${baseURL}/data_service/website/images`),
                fetch(`${baseURL}/data_service/website/description`),
            ]);

            if (imgRes.ok) {
                const imgData = await imgRes.json();
                setHeroSlides(imgData.BANNER || []);
                setPromoSlides(imgData.MAIN_IMG || []);
            }
            if (descRes.ok) {
                const descData = await descRes.json();
                setAnnouncementText(descData.massege || "");
            }
        } catch (err) {
            console.error("Public config error:", err);
        }
    }, [baseURL]);

    // 🛠 useEffect หลัก: ทำงานตอนโหลดแอปครั้งแรก
    useEffect(() => {
        // 1. ดึงข้อมูลสาธารณะ
        fetchWebsiteConfig();
        fetchShopData();
        
        // 2. เช็คสถานะ Login
        const token = localStorage.getItem("token");
        const rfToken = localStorage.getItem("refresh_token");

        if (token) {
            fetchUserData();
        } else if (rfToken) {
            refreshToken().then(newToken => {
                if (newToken) fetchUserData();
                else setAuthLoading(false);
            });
        } else {
            setAuthLoading(false);
        }
    }, [fetchUserData, fetchWebsiteConfig, fetchShopData, refreshToken]);

    return (
        <DataContext.Provider
            value={{
                // Auth
                role, setRole,
                userId, setUserId,
                islogin, setIsLogin,
                username, setUsername,
                profileImg, setProfileImg,
                userData,
                authLoading,
                fetchUserData,
                handleLogout,
                baseURL,
                fetchWithAuth,

                // Website Config
                heroSlides, setHeroSlides,
                promoSlides, setPromoSlides,
                announcementText, setAnnouncementText,
                fetchWebsiteConfig,

                // Shop Management (ส่งไปใช้ใน ShopSetting)
                shopOpenTime,
                shopCloseTime,
                shopStatus,
                fetchShopData // สำคัญ: เพื่อใช้สั่งอัปเดตข้อมูลหลังบันทึกเสร็จ
            }}
        >
            {children}
        </DataContext.Provider>
    );
}