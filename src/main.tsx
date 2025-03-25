import { createRoot } from 'react-dom/client'
import { App } from './pages/CarRacer'
import { BrowserRouter } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import TypeRacerPage from './pages/TypeRacerPage'
import { HomePage } from './pages/HomePage'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import FlappyBirdGame from './pages/flappyBird'
import MemoryGame from './pages/Memory'

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as string}>
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<HomePage />} /> {/* Updated */}
        <Route path="/car-racer" element={<App />} />
        <Route path="/type-racer" element={<TypeRacerPage />} />
        <Route path="/flappy-bird" element={<FlappyBirdGame />} />
        <Route path="/memory-game" element={<MemoryGame />} />
      </Routes>
    </BrowserRouter>
    ,
  </GoogleOAuthProvider>,
)
