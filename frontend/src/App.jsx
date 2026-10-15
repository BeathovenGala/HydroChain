import { BrowserRouter, Route, Routes } from "react-router-dom"
import Home from "./Pages/Home"
import Login from "./Pages/Login"
import Register from "./Pages/Register"
import PlantDashboard from "./Pages/PlantDashboard"
import ProtectedRoute from "./components/ProtactRoute"
import IndustryDashboard from "./Pages/IndustryDashboard"
import AuditDashboard from "./Pages/AuditDashboard"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/plant/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Plant"]}>
              <PlantDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/industry/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Industry"]}>
              <IndustryDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/auditor/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Auditor"]}>
              <AuditDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
