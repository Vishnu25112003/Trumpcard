import { createContext, useContext, useState } from 'react';

const HCContext = createContext();

export function HCProvider({ children }) {
  const [myRole,       setMyRole]       = useState(null);   // 'host' | 'guest'
  const [roomCode,     setRoomCode]     = useState(null);
  const [roomSettings, setRoomSettings] = useState(null);
  const [hostName,     setHostName]     = useState(null);
  const [guestName,    setGuestName]    = useState(null);

  const initRoom = ({ role, roomCode: code, settings, hostName: hn, guestName: gn }) => {
    setMyRole(role);
    setRoomCode(code);
    setRoomSettings(settings);
    if (hn) setHostName(hn);
    if (gn) setGuestName(gn);
  };

  const clearRoom = () => {
    setMyRole(null); setRoomCode(null); setRoomSettings(null);
    setHostName(null); setGuestName(null);
  };

  return (
    <HCContext.Provider value={{ myRole, roomCode, roomSettings, hostName, guestName, initRoom, clearRoom, setHostName, setGuestName }}>
      {children}
    </HCContext.Provider>
  );
}

export const useHC = () => useContext(HCContext);
