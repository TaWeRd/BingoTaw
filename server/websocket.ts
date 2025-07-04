import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { storage } from "./mongodb-storage";

let io: SocketIOServer;

export function setupWebSocket(httpServer: HttpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Join game session room
    socket.on("join-game", async (data: { sessionId: string; isGameMaster?: boolean; playerData?: any }) => {
      const { sessionId, isGameMaster = false, playerData } = data;
      
      socket.join(`game-${sessionId}`);
      socket.data.isGameMaster = isGameMaster;
      socket.data.sessionId = sessionId;
      socket.data.playerData = playerData;
      
      console.log(`Client ${socket.id} joined game ${sessionId}${isGameMaster ? ' as game master' : ''}`);
      
      // Count connected players and update their status
      const room = io.sockets.adapter.rooms.get(`game-${sessionId}`);
      const connectedPlayers: any[] = [];
      
      if (room) {
        const socketIds = Array.from(room);
        for (const socketId of socketIds) {
          const clientSocket = io.sockets.sockets.get(socketId);
          if (clientSocket && !clientSocket.data.isGameMaster && clientSocket.data.playerData) {
            connectedPlayers.push({
              ...clientSocket.data.playerData,
              socketId: clientSocket.id,
              conectado: true
            });
          }
        }
      }
      
      // Broadcast updated player list to all clients in the session
      io.to(`game-${sessionId}`).emit("players-updated", connectedPlayers);
      
      // If this is a player joining, update their status in database
      if (!isGameMaster && playerData) {
        try {
          await storage.updatePlayer(playerData.uuid, { conectado: true });
        } catch (error) {
          console.error("Error updating player connection status:", error);
        }
      }
    });

    // Handle player card selection
    socket.on("player-card-selected", async (data: { sessionId: string; playerUuid: string; selectedCard: any }) => {
      try {
        const { sessionId, playerUuid, selectedCard } = data;
        
        // Update player with selected card
        await storage.updatePlayer(playerUuid, { 
          carton: selectedCard,
          conectado: true
        });
        
        // Get updated player list
        const players = await storage.getPlayersBySession(sessionId);
        
        // Broadcast updated player list
        io.to(`game-${sessionId}`).emit("players-updated", players);
        
        console.log(`Player ${playerUuid} selected card in session ${sessionId}`);
      } catch (error) {
        console.error("Error updating player card selection:", error);
        socket.emit("error", { message: "Error selecting card" });
      }
    });

    // Handle number drawing
    socket.on("draw-number", async (data: { sessionId: string; number: string }) => {
      try {
        const { sessionId, number } = data;
        const session = await storage.getSession(sessionId);
        
        if (!session) {
          socket.emit("error", { message: "Game session not found" });
          return;
        }

        // Update session with new drawn number
        const drawnNumbers = [...(session.drawnNumbers || []), number];
        const updatedSession = await storage.updateSession(sessionId, {
          drawnNumbers
        });

        if (updatedSession) {
          // Broadcast the new number to all players in the game
          io.to(`game-${sessionId}`).emit("number-drawn", {
            number,
            drawnNumbers,
            progress: Math.round((drawnNumbers.length / 75) * 100)
          });
        }
      } catch (error) {
        console.error("Error drawing number:", error);
        socket.emit("error", { message: "Error drawing number" });
      }
    });

    // Handle bingo claims
    socket.on("claim-bingo", async (data: { sessionId: string; playerUuid: string; carton: any; marcados: string[] }) => {
      try {
        const { sessionId, playerUuid, carton, marcados } = data;
        const session = await storage.getSession(sessionId);
        
        if (!session) {
          socket.emit("error", { message: "Session not found" });
          return;
        }

        // Validate bingo win
        const isValidBingo = validateBingo(carton, marcados, session.modalidad);
        
        if (isValidBingo) {
          const player = await storage.getPlayer(playerUuid);
          
          // Broadcast winner to all players
          io.to(`game-${sessionId}`).emit("bingo-winner", {
            playerUuid,
            playerName: player?.playerName,
            carton,
            marcados
          });
          
          // Update session to finished
          await storage.updateSession(sessionId, { estado: 'finalizado' });
          
        } else {
          socket.emit("invalid-bingo", { message: "No hay patrón ganador válido" });
        }
      } catch (error) {
        console.error("Error validating bingo:", error);
        socket.emit("error", { message: "Error validating bingo" });
      }
    });

    // Handle game state changes
    socket.on("update-game-state", async (data: { sessionId: string; updates: any }) => {
      try {
        const { sessionId, updates } = data;
        const updatedSession = await storage.updateSession(sessionId, updates);
        
        if (updatedSession) {
          io.to(`game-${sessionId}`).emit("game-state-updated", updatedSession);
        }
      } catch (error) {
        console.error("Error updating game state:", error);
        socket.emit("error", { message: "Error updating game state" });
      }
    });

    socket.on("disconnect", async () => {
      console.log("Client disconnected:", socket.id);
      
      // Update player status when someone disconnects
      if (socket.data.sessionId && !socket.data.isGameMaster && socket.data.playerData) {
        try {
          await storage.updatePlayer(socket.data.playerData.uuid, { conectado: false });
          
          // Get updated player list and broadcast
          const players = await storage.getPlayersBySession(socket.data.sessionId);
          io.to(`game-${socket.data.sessionId}`).emit("players-updated", players);
        } catch (error) {
          console.error("Error updating player disconnect status:", error);
        }
      }
    });
  });
}

// Helper function to validate bingo wins
function validateBingo(carton: any, marcados: string[], modalidad: string): boolean {
  // Convert carton to grid format
  const grid: boolean[][] = Array(5).fill(null).map(() => Array(5).fill(false));
  
  // Mark numbers based on drawn numbers
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        grid[row][col] = true; // FREE space
        continue;
      }
      
      const cellNumber = carton[row][col];
      const columns = ['B', 'I', 'N', 'G', 'O'];
      const bingoNumber = `${columns[col]}${cellNumber}`;
      
      if (marcados.includes(bingoNumber)) {
        grid[row][col] = true;
      }
    }
  }
  
  // Check patterns based on modalidad
  switch (modalidad) {
    case "Línea Horizontal":
      return grid.some(row => row.every(cell => cell));
    
    case "Línea Vertical":
      for (let col = 0; col < 5; col++) {
        if (grid.every(row => row[col])) return true;
      }
      return false;
    
    case "Diagonal":
      const diagonal1 = grid.every((row, i) => row[i]);
      const diagonal2 = grid.every((row, i) => row[4 - i]);
      return diagonal1 || diagonal2;
    
    case "Cruz":
      const centerRow = grid[2].every(cell => cell);
      const centerCol = grid.every(row => row[2]);
      return centerRow && centerCol;
    
    case "Cartón Lleno":
      return grid.every(row => row.every(cell => cell));
    
    default:
      return false;
  }
}

export { io };