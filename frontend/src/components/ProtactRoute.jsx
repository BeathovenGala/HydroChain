import { client } from "../../config"
import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

function ProtectedRoute({ children, allowedRoles }) {
    const [auth, setAuth] = useState({
        isAuthenticated: null,
        role: null,
    })

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await client.get("/me")
                setAuth({
                    isAuthenticated: true,
                    role: res.data?.data?.role || null,
                })
            } catch (error) {
                if (error.response?.status === 401) {
                    setAuth({ isAuthenticated: false, role: null })
                } else {
                    console.error("Unexpected error:", error)
                    setAuth({ isAuthenticated: false, role: null })
                }
            }
        }

        checkAuth()
    }, [])

    if (auth.isAuthenticated === null) {
        return <div>Loading...</div>
    }

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(auth.role)) {
        return <Navigate to="/" replace /> // or maybe a "403 Forbidden" page
    }

    return children
}

export default ProtectedRoute
