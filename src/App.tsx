import { Navigate, Route, Routes } from 'react-router-dom'
import { CivicStoreProvider } from './hooks/useCivicStore'
import { LandingPage } from './components/landing/LandingPage'
import { ResidentPage } from './pages/ResidentPage'
import { LeadershipPage } from './pages/LeadershipPage'

export default function App() {
  return (
    <CivicStoreProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/resident" element={<ResidentPage />} />
        <Route path="/leadership" element={<LeadershipPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </CivicStoreProvider>
  )
}
