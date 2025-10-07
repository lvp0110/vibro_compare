import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.jsx'
// import Home from './pages/Home.jsx'
import Vibro from './pages/Vibro.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<App />}>
          {/* <Route index element={<Home />} /> */}
          <Route path='/vibro' element={<Vibro />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
