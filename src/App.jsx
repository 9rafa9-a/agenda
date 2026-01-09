import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './components/dashboard/Dashboard'
import DiseaseEditor from './components/disease/DiseaseEditor'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="new" element={<DiseaseEditor />} />
        <Route path="edit/:id" element={<DiseaseEditor />} />
      </Route>
    </Routes>
  )
}

export default App
