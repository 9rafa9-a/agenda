import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './components/dashboard/Dashboard'
import DiseaseEditor from './components/disease/DiseaseEditor'

function App() {
  const handleSave = (data) => {
    console.log('Saved Data:', data);
    alert('Resumo salvo (simulação). Verifique o console.');
    // Here we would call Firebase
  };

  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="new" element={<DiseaseEditor onSave={handleSave} />} />
        <Route path="edit/:id" element={<DiseaseEditor onSave={handleSave} initialData={{ name: 'Exemplo Editável', topics: {} }} />} />
      </Route>
    </Routes>
  )
}

export default App
