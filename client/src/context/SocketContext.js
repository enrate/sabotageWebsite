import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io as socketIO } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ onNewMessage, children }) => {
  const { currentUser } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!socketRef.current && currentUser) {
      socketRef.current = socketIO('http://localhost:5001', {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket']
      });
    }
    const socket = socketRef.current;
    if (!socket) return;
    const handleNewMessage = (msg) => {
      if (onNewMessage && msg.receiverId === currentUser?.id) {
        onNewMessage(msg);
      }
    };
    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [currentUser, onNewMessage]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}; 