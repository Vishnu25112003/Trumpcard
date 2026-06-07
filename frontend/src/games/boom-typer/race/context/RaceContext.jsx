import { createContext, useCallback, useContext, useState } from 'react';

// Lightweight room context for the Boom Typer Friends race, mirroring the
// hub's other game contexts. Holds lobby metadata between route changes;
// the live race state lives in RacePage (driven by sockets).

const RaceContext = createContext();

export function RaceProvider({ children }) {
  const [roomCode, setRoomCode] = useState(null);
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [difficulty, setDifficulty] = useState('medium');
  const [isHost, setIsHost] = useState(false);

  const initRoom = useCallback(({ roomCode: code, maxPlayers: max, difficulty: diff, isHost: host }) => {
    setRoomCode(code);
    setMaxPlayers(max || 6);
    setDifficulty(diff || 'medium');
    setIsHost(!!host);
  }, []);

  const clearRoom = useCallback(() => {
    setRoomCode(null);
    setMaxPlayers(6);
    setDifficulty('medium');
    setIsHost(false);
  }, []);

  return (
    <RaceContext.Provider value={{ roomCode, maxPlayers, difficulty, isHost, initRoom, clearRoom }}>
      {children}
    </RaceContext.Provider>
  );
}

export const useRace = () => useContext(RaceContext);
