import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const API_URL = 'http://192.168.0.126:3000';

interface WebSocketContextType {
  socket: Socket | null;
  connected: boolean;
  joinMatchmaking: (type: 'RANKED' | 'CASUAL') => void;
  leaveMatchmaking: () => void;
  sendMatchHeartbeat: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { token, user } = useAuth();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (token && user) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [token, user]);

  const connectSocket = async () => {
    if (socketRef.current?.connected) {
      return;
    }

    const newSocket = io(API_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected');
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
  };

  const disconnectSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    }
  };

  const joinMatchmaking = (type: 'RANKED' | 'CASUAL') => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('matchmaking:join', { type });
    }
  };

  const leaveMatchmaking = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('matchmaking:leave');
    }
  };

  const sendMatchHeartbeat = () => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('match:heartbeat');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{
        socket,
        connected,
        joinMatchmaking,
        leaveMatchmaking,
        sendMatchHeartbeat,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
