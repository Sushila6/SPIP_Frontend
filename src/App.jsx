import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<HomePage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/signup"    element={<SignupPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="*"          element={<Navigate to="/" replace />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
