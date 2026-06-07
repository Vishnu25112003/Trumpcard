import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { PlayerProvider, usePlayer } from './shared/context/PlayerContext';
import { TrumpcardProvider } from './games/trumpcard/context/TrumpcardContext';
import { HCProvider } from './games/handcricket/context/HCContext';
import { RajaRaniProvider } from './games/rajarani/context/RajaRaniContext';
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
import BoomTyperSolo from './games/boom-typer';
import { RaceProvider } from './games/boom-typer/race/context/RaceContext';
// Race pages pull in three.js — lazy-load so that heavy 3D bundle is only
// fetched when a player actually enters the Friends race.
const RaceDashboardPage = lazy(() => import('./games/boom-typer/race/pages/RaceDashboardPage'));
const RaceLobbyPage = lazy(() => import('./games/boom-typer/race/pages/RaceLobbyPage'));
const RacePage = lazy(() => import('./games/boom-typer/race/pages/RacePage'));
const RaceResultsPage = lazy(() => import('./games/boom-typer/race/pages/RaceResultsPage'));
import PortalPage from './hub/pages/PortalPage';

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

function BoomRaceLayout() {
  return (
    <RaceProvider>
      <Suspense fallback={(
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#060809', color: '#8595928f', fontFamily: 'system-ui, sans-serif', letterSpacing: '0.1em',
        }}>Loading race…</div>
      )}>
        <Outlet />
      </Suspense>
    </RaceProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HubPage />} />
      <Route path="/portal" element={<PortalPage />} />
      <Route path="/boom-typer" element={<BoomTyperSolo />} />

      <Route element={<BoomRaceLayout />}>
        <Route path="/boom-typer/race" element={<RaceDashboardPage />} />
        <Route path="/boom-typer/race/lobby/:code" element={<RaceLobbyPage />} />
        <Route path="/boom-typer/race/play/:code" element={<RacePage />} />
        <Route path="/boom-typer/race/results/:code" element={<RaceResultsPage />} />
      </Route>

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
