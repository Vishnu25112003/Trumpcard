import { createContext, useContext, useState } from 'react';

const GameContext = createContext();

export function GameProvider({ children }) {
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('playerName') || ''
  );
  const [currentRoom, setCurrentRoom] = useState(null);

  const saveName = (name) => {
    localStorage.setItem('playerName', name.trim());
    setPlayerName(name.trim());
  };

  const clearName = () => {
    localStorage.removeItem('playerName');
    setPlayerName('');
  };

  return (
    <GameContext.Provider value={{ playerName, saveName, clearName, currentRoom, setCurrentRoom }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
