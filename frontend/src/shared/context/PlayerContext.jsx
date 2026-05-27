import { createContext, useContext, useState } from 'react';

const PlayerContext = createContext();

export function PlayerProvider({ children }) {
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('playerName') || ''
  );

  const saveName = (name) => {
    localStorage.setItem('playerName', name.trim());
    setPlayerName(name.trim());
  };

  const clearName = () => {
    localStorage.removeItem('playerName');
    setPlayerName('');
  };

  return (
    <PlayerContext.Provider value={{ playerName, saveName, clearName }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => useContext(PlayerContext);
