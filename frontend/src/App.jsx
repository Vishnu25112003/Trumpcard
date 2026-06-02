import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PlayerProvider, usePlayer } from './shared/context/PlayerContext';
import { TrumpcardProvider } from './games/trumpcard/context/TrumpcardContext';
import { HCProvider } from './games/handcricket/context/HCContext';
import { RajaRaniProvider } from './games/rajarani/context/RajaRaniContext';
import { TypingProvider } from './games/typing-game/context/TypingContext';
import HubPage from './hub/pages/HubPage';
import HomePage from './games/trumpcard/pages/HomePage';
import DashboardPage from './games/trumpcard/pages/DashboardPage';
import LobbyPage from './games/trumpcard/pages/LobbyPage';
import GamePage from './games/trumpcard/pages/GamePage';
import AdminPage from './games/trumpcard/pages/AdminPage';
import HCHomePage from './games/handcricket/pages/HCHomePage';
import HCDashboardPage from './games/handcricket/pages/HCDashboardPage';
import HCLobbyPage from './games/handcricket/pages/HCLobbyPage';
import HCGamePage from './games/handcricket/pages/HCGamePage';
import RajaRaniHomePage from './games/rajarani/pages/RajaRaniHomePage';
import RajaRaniDashboardPage from './games/rajarani/pages/RajaRaniDashboardPage';
import RajaRaniLobbyPage from './games/rajarani/pages/RajaRaniLobbyPage';
import RajaRaniGamePage from './games/rajarani/pages/RajaRaniGamePage';
import RajaRaniResultsPage from './games/rajarani/pages/RajaRaniResultsPage';
import TypingHomePage from './games/typing-game/pages/TypingHomePage';
import TypingDashboardPage from './games/typing-game/pages/TypingDashboardPage';
import TypingLobbyPage from './games/typing-game/pages/TypingLobbyPage';
import TypingRacePage from './games/typing-game/pages/TypingRacePage';
import TypingResultsPage from './games/typing-game/pages/TypingResultsPage';
import SoloGame from './games/typing-game/solo/SoloGame';

function ProtectedRoute({ children, fallback }) {
  const { playerName } = usePlayer();
  return playerName ? children : <Navigate to={fallback} replace />;
}

function TrumpcardLayout() {
  return (
    <TrumpcardProvider>
      <Outlet />
    </TrumpcardProvider>
  );
}

function HandCricketLayout() {
  return (
    <HCProvider>
      <Outlet />
    </HCProvider>
  );
}

function RajaRaniLayout() {
  return (
    <RajaRaniProvider>
      <Outlet />
    </RajaRaniProvider>
  );
}

function TypingLayout() {
  return (
    <TypingProvider>
      <Outlet />
    </TypingProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HubPage />} />

      <Route element={<TrumpcardLayout />}>
        <Route path="/trumpcard" element={<HomePage />} />
        <Route path="/trumpcard/dashboard" element={<ProtectedRoute fallback="/trumpcard"><DashboardPage /></ProtectedRoute>} />
        <Route path="/trumpcard/lobby/:roomCode" element={<ProtectedRoute fallback="/trumpcard"><LobbyPage /></ProtectedRoute>} />
        <Route path="/trumpcard/game/:roomCode" element={<ProtectedRoute fallback="/trumpcard"><GamePage /></ProtectedRoute>} />
        <Route path="/trumpcard/admin" element={<AdminPage />} />
      </Route>

      <Route element={<HandCricketLayout />}>
        <Route path="/hand-cricket" element={<HCHomePage />} />
        <Route path="/hand-cricket/dashboard" element={<ProtectedRoute fallback="/hand-cricket"><HCDashboardPage /></ProtectedRoute>} />
        <Route path="/hand-cricket/lobby/:code" element={<ProtectedRoute fallback="/hand-cricket"><HCLobbyPage /></ProtectedRoute>} />
        <Route path="/hand-cricket/play/:code" element={<ProtectedRoute fallback="/hand-cricket"><HCGamePage /></ProtectedRoute>} />
      </Route>

      <Route element={<RajaRaniLayout />}>
        <Route path="/rajarani" element={<RajaRaniHomePage />} />
        <Route path="/rajarani/dashboard" element={<ProtectedRoute fallback="/rajarani"><RajaRaniDashboardPage /></ProtectedRoute>} />
        <Route path="/rajarani/lobby/:code" element={<ProtectedRoute fallback="/rajarani"><RajaRaniLobbyPage /></ProtectedRoute>} />
        <Route path="/rajarani/game/:code" element={<ProtectedRoute fallback="/rajarani"><RajaRaniGamePage /></ProtectedRoute>} />
        <Route path="/rajarani/results/:code" element={<ProtectedRoute fallback="/rajarani"><RajaRaniResultsPage /></ProtectedRoute>} />
      </Route>

      <Route element={<TypingLayout />}>
        <Route path="/typing-game" element={<TypingHomePage />} />
        <Route path="/typing-game/dashboard" element={<ProtectedRoute fallback="/typing-game"><TypingDashboardPage /></ProtectedRoute>} />
        <Route path="/typing-game/solo" element={<ProtectedRoute fallback="/typing-game"><SoloGame /></ProtectedRoute>} />
        <Route path="/typing-game/lobby/:code" element={<ProtectedRoute fallback="/typing-game"><TypingLobbyPage /></ProtectedRoute>} />
        <Route path="/typing-game/race/:code" element={<ProtectedRoute fallback="/typing-game"><TypingRacePage /></ProtectedRoute>} />
        <Route path="/typing-game/results/:code" element={<ProtectedRoute fallback="/typing-game"><TypingResultsPage /></ProtectedRoute>} />
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
