import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io as socketIO } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ onNewMessage, onNewNotification, children }) => {
  const { currentUser } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('[SOCKET CONTEXT] useEffect, currentUser:', currentUser);
    if (!socketRef.current && currentUser) {
      socketRef.current = socketIO(process.env.NODE_ENV === 'production' ? 'wss://sabotage-games.ru' :'http://localhost:5001', {
        auth: { token: localStorage.getItem('token') },
        transports: ['websocket']
      });
      console.log('[SOCKET CONTEXT] socket created', socketRef.current);
    }
    const socket = socketRef.current;
    if (!socket) {
      console.log('[SOCKET CONTEXT] socket is null, skip subscribe');
      return;
    }
    
    const handleNewMessage = (msg) => {
      console.log('[SOCKET CONTEXT] handleNewMessage', msg, 'currentUser:', currentUser);
      if (onNewMessage && msg.receiverId === currentUser?.id) {
        onNewMessage(msg);
      }
    };
    
    const handleNewNotification = (notification) => {
      console.log('[SOCKET CONTEXT] handleNewNotification', notification, 'currentUser:', currentUser);
      if (onNewNotification && notification.userId === currentUser?.id) {
        onNewNotification(notification);
      }
    };
    
    socket.on('connect', () => {
      console.log('[SOCKET CONTEXT] connected', socket.id);
    });
    socket.on('new_message', handleNewMessage);
    socket.on('new_notification', handleNewNotification);
    
    return () => {
      socket.off('connect');
      socket.off('new_message', handleNewMessage);
      socket.off('new_notification', handleNewNotification);
    };
  }, [currentUser, onNewMessage, onNewNotification]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}; 