import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  sessionId?: string;
  isGameMaster?: boolean;
  playerData?: any;
}

export function useSocket({ sessionId, isGameMaster = false, playerData }: UseSocketProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    // Create socket connection
    const newSocket = io({
      autoConnect: true,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Socket.IO connected');
      setConnected(true);
      
      // Join the game session
      newSocket.emit('join-game', {
        sessionId,
        isGameMaster,
        playerData
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      setConnected(false);
    });

    // Game events
    newSocket.on('players-updated', (updatedPlayers: any[]) => {
      setPlayers(updatedPlayers);
    });

    newSocket.on('number-drawn', (data: { number: string; drawnNumbers: string[]; progress: number }) => {
      // This will be handled by specific components
      console.log('Number drawn:', data);
    });

    newSocket.on('bingo-winner', (data: { playerUuid: string; playerName: string }) => {
      console.log('Bingo winner:', data);
    });

    newSocket.on('game-state-updated', (sessionData: any) => {
      console.log('Game state updated:', sessionData);
    });

    newSocket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId, isGameMaster, playerData]);

  // Socket methods
  const emitPlayerCardSelected = (playerUuid: string, selectedCard: any) => {
    if (socket && connected) {
      socket.emit('player-card-selected', {
        sessionId,
        playerUuid,
        selectedCard
      });
    }
  };

  const emitDrawNumber = (number: string) => {
    if (socket && connected) {
      socket.emit('draw-number', {
        sessionId,
        number
      });
    }
  };

  const emitClaimBingo = (playerUuid: string, carton: any, marcados: string[]) => {
    if (socket && connected) {
      socket.emit('claim-bingo', {
        sessionId,
        playerUuid,
        carton,
        marcados
      });
    }
  };

  const emitUpdateGameState = (updates: any) => {
    if (socket && connected) {
      socket.emit('update-game-state', {
        sessionId,
        updates
      });
    }
  };

  return {
    socket,
    connected,
    players,
    emitPlayerCardSelected,
    emitDrawNumber,
    emitClaimBingo,
    emitUpdateGameState
  };
}