import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sp_token'))
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sp_user')) } catch { return null }
  })

  function login(data) {
    setToken(data.token)
    setCurrentUser(data.user)
    localStorage.setItem('sp_token', data.token)
    localStorage.setItem('sp_user', JSON.stringify(data.user))
  }

  function logout() {
    setToken(null); setCurrentUser(null)
    localStorage.removeItem('sp_token'); localStorage.removeItem('sp_user')
  }

  function updateUser(user) {
    setCurrentUser(user)
    localStorage.setItem('sp_user', JSON.stringify(user))
  }

  const isAdmin = () => currentUser?.role === 'ADMIN'
  const isAuthenticated = Boolean(token && currentUser)

  return (
    <AuthContext.Provider value={{ token, currentUser, isAdmin, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
