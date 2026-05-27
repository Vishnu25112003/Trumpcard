import { createContext, useContext, useState } from 'react';

const TrumpcardContext = createContext();

export function TrumpcardProvider({ children }) {
  const [currentRoom, setCurrentRoom] = useState(null);

  return (
    <TrumpcardContext.Provider value={{ currentRoom, setCurrentRoom }}>
      {children}
    </TrumpcardContext.Provider>
  );
}

export const useTrumpcard = () => useContext(TrumpcardContext);
