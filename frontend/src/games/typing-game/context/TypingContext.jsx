import { createContext, useCallback, useContext, useState } from 'react';

const TypingContext = createContext();

export function TypingProvider({ children }) {
  const [roomCode, setRoomCode] = useState(null);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [difficulty, setDifficulty] = useState('medium');
  const [isHost, setIsHost] = useState(false);

  const initRoom = useCallback(({ roomCode: code, maxPlayers: max, difficulty: diff, isHost: host }) => {
    setRoomCode(code);
    setMaxPlayers(max || 8);
    setDifficulty(diff || 'medium');
    setIsHost(!!host);
  }, []);

  const clearRoom = useCallback(() => {
    setRoomCode(null);
    setMaxPlayers(8);
    setDifficulty('medium');
    setIsHost(false);
  }, []);

  return (
    <TypingContext.Provider value={{ roomCode, maxPlayers, difficulty, isHost, initRoom, clearRoom }}>
      {children}
    </TypingContext.Provider>
  );
}

export const useTyping = () => useContext(TypingContext);
