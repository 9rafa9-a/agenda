import { Routes, Route } from 'react-router-dom'
import MainLayout from './components/layout/MainLayout'
import Dashboard from './components/dashboard/Dashboard';
import DiseaseEditor from './components/disease/DiseaseEditor';
import FlashcardDashboard from './components/flashcards/FlashcardDashboard';
import QuizDashboard from './components/quiz/QuizDashboard';
import QuizSheet from './components/quiz/QuizSheet';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';
import HelpPage from './components/layout/HelpPage';

import { TourProvider } from './contexts/TourContext';

function App() {
  return (
    <TourProvider>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="new" element={<DiseaseEditor />} />
          <Route path="edit/:id" element={<DiseaseEditor />} />
          <Route path="flashcards" element={<FlashcardDashboard />} />
          <Route path="quizzes" element={<QuizDashboard />} />
          <Route path="quizzes/:id" element={<QuizSheet />} />
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="help" element={<HelpPage />} />
        </Route>
      </Routes>
    </TourProvider>
  );
}

export default App
