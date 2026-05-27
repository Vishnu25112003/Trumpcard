import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PlayerProvider, usePlayer } from './shared/context/PlayerContext';
import { TrumpcardProvider } from './games/trumpcard/context/TrumpcardContext';
import HubPage from './hub/pages/HubPage';
import HomePage from './games/trumpcard/pages/HomePage';
import DashboardPage from './games/trumpcard/pages/DashboardPage';
import LobbyPage from './games/trumpcard/pages/LobbyPage';
import GamePage from './games/trumpcard/pages/GamePage';
import AdminPage from './games/trumpcard/pages/AdminPage';

function ProtectedRoute({ children }) {
  const { playerName } = usePlayer();
  return playerName ? children : <Navigate to="/trumpcard" replace />;
}

function TrumpcardLayout() {
  return (
    <TrumpcardProvider>
      <Outlet />
    </TrumpcardProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HubPage />} />
      <Route element={<TrumpcardLayout />}>
        <Route path="/trumpcard" element={<HomePage />} />
        <Route path="/trumpcard/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/trumpcard/lobby/:roomCode" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
        <Route path="/trumpcard/game/:roomCode" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/trumpcard/admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
        <AppRoutes />
      </PlayerProvider>
    </BrowserRouter>
  );
}
