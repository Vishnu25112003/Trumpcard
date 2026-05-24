import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider, useGame } from './context/GameContext';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }) {
  const { playerName } = useGame();
  return playerName ? children : <Navigate to="/" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/lobby/:roomCode" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
      <Route path="/game/:roomCode" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <AppRoutes />
      </GameProvider>
    </BrowserRouter>
  );
}
