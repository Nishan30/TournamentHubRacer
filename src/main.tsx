import { createRoot } from 'react-dom/client'
import { App } from './pages/CarRacer'
import { BrowserRouter } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import TypeRacerPage from './pages/TypeRacerPage'
import { HomePage } from './pages/HomePage'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} /> {/* Updated */}
      <Route path="/car-racer" element={<App />} />
      <Route path="/type-racer" element={<TypeRacerPage />} />
    </Routes>
  </BrowserRouter>,
)
