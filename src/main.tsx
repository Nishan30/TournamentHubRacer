import { createRoot } from 'react-dom/client'

import 'inter-ui'
import './styles.css'
import { App } from './App'
import { BrowserRouter } from 'react-router-dom'
import { Route, Routes } from 'react-router-dom'
import TypeRacerPage from './pages/TypeRacerPage'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/car-racer" element={<App />} />

      <Route path="/type-racer" element={<TypeRacerPage />} />
    </Routes>
  </BrowserRouter>,
)
