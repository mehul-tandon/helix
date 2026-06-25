import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import BoardsPage from './pages/BoardsPage'
import BoardPage from './pages/BoardPage'
import AuditPage from './pages/AuditPage'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><span className="spinner-lg" /></div>
  return user ? children : <Navigate to="/auth" replace />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/boards" element={<PrivateRoute><BoardsPage /></PrivateRoute>} />
          <Route path="/boards/:id" element={<PrivateRoute><BoardPage /></PrivateRoute>} />
          <Route path="/audit" element={<PrivateRoute><AuditPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/boards" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
