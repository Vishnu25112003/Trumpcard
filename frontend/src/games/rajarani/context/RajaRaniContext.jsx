import { createContext, useCallback, useContext, useState } from 'react';

const RajaRaniContext = createContext();

export function RajaRaniProvider({ children }) {
  const [roomCode, setRoomCode] = useState(null);
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isHost, setIsHost] = useState(false);

  const initRoom = useCallback(({ roomCode: code, maxPlayers: max, isHost: host }) => {
    setRoomCode(code);
    setMaxPlayers(max || 4);
    setIsHost(!!host);
  }, []);

  const clearRoom = useCallback(() => {
    setRoomCode(null);
    setMaxPlayers(4);
    setIsHost(false);
  }, []);

  return (
    <RajaRaniContext.Provider value={{ roomCode, maxPlayers, isHost, initRoom, clearRoom }}>
      {children}
    </RajaRaniContext.Provider>
  );
}

export const useRajaRani = () => useContext(RajaRaniContext);
