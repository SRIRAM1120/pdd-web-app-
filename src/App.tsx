import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { isFirebaseConfigured } from './lib/firebase'
import { LabWorkspace } from './pages/LabWorkspace'
import { ForgotPassword } from './pages/ForgotPassword'
import { Legal } from './pages/Legal'
import { NotFound } from './pages/NotFound'
import { SignIn } from './pages/SignIn'
import { SignUp } from './pages/SignUp'

export default function App() {
  return <BrowserRouter><AuthProvider>
    {!isFirebaseConfigured && <div className="config-banner" role="status">Preview mode · Add Firebase values to <code>.env.local</code> to enable authentication.</div>}
    <Routes>
    <Route path="/" element={<SignIn />} />
    <Route path="/signin" element={<SignIn />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/privacy" element={<Legal type="privacy" />} />
    <Route path="/terms" element={<Legal type="terms" />} />
    <Route element={<ProtectedRoute />}>
      <Route path="/home" element={<LabWorkspace />} />
      <Route path="/account" element={<LabWorkspace />} />
    </Route>
    <Route path="*" element={<NotFound />} />
    </Routes>
  </AuthProvider></BrowserRouter>
}
