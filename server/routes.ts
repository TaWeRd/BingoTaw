import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertSessionSchema, insertPlayerSchema, insertPatternSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedClients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws: WebSocket, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const uuid = url.searchParams.get('uuid');
    const clientId = uuid || sessionId || `anonymous-${Date.now()}`;
    
    connectedClients.set(clientId, ws);
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'bingo_claim':
            await handleBingoClaim(data, clientId);
            break;
          case 'player_join':
            broadcastToSession(data.sessionId, {
              type: 'player_joined',
              player: data.player
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      connectedClients.delete(clientId);
    });
  });
  
  function broadcastToSession(sessionId: string, message: any) {
    connectedClients.forEach((client, clientId) => {
      if (client.readyState === WebSocket.OPEN && 
          (clientId.startsWith(sessionId) || clientId.includes(sessionId))) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  function broadcastToAll(message: any) {
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
  
  async function handleBingoClaim(data: any, clientId: string) {
    const player = await storage.getPlayer(data.uuid);
    if (!player) return;
    
    const session = await storage.getSession(player.sessionId);
    if (!session || session.estado !== 'activo') return;
    
    // Validate bingo
    const isValid = validateBingo(player.carton, player.numerosMaracados || [], session.modalidad);
    
    if (isValid) {
      await storage.updateSession(player.sessionId, {
        estado: 'pausado',
        ganador: player.playerName
      });
      
      broadcastToSession(player.sessionId, {
        type: 'bingo_winner',
        winner: player.playerName,
        uuid: player.uuid
      });
    }
  }
  
  function validateBingo(carton: any, marcados: string[], modalidad: string): boolean {
    // Simplified validation - in real implementation, check against pattern
    return marcados.length >= 5;
  }

  // Authentication routes
  app.post("/api/auth", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (username === "master" && password === "master1") {
        const user = await storage.getUserByUsername(username);
        if (user) {
          res.json({ success: true, user: { id: user.id, username: user.username } });
        } else {
          res.status(401).json({ message: "Invalid credentials" });
        }
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: "Authentication error" });
    }
  });

  // Session management routes
  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getAllSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/active", async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions();
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active sessions" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = insertSessionSchema.parse(req.body);
      const session = await storage.createSession(validatedData);
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  app.patch("/api/sessions/:sessionId", async (req, res) => {
    try {
      const session = await storage.updateSession(req.params.sessionId, req.body);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to update session" });
    }
  });

  app.delete("/api/sessions/:sessionId", async (req, res) => {
    try {
      const deleted = await storage.deleteSession(req.params.sessionId);
      if (!deleted) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete session" });
    }
  });

  // Game control routes
  app.post("/api/game/:sessionId/draw", async (req, res) => {
    try {
      const session = await storage.getSession(req.params.sessionId);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const drawnNumbers = session.drawnNumbers || [];
      const newNumber = generateNextNumber(drawnNumbers);
      
      if (!newNumber) {
        return res.status(400).json({ message: "All numbers have been drawn" });
      }

      const updatedNumbers = [...drawnNumbers, newNumber];
      const updatedSession = await storage.updateSession(req.params.sessionId, {
        drawnNumbers: updatedNumbers
      });

      // Broadcast to all clients in this session
      broadcastToSession(req.params.sessionId, {
        type: 'number_drawn',
        number: newNumber,
        drawnNumbers: updatedNumbers
      });

      res.json({ number: newNumber, session: updatedSession });
    } catch (error) {
      res.status(500).json({ message: "Failed to draw number" });
    }
  });

  app.post("/api/game/:sessionId/pause", async (req, res) => {
    try {
      const session = await storage.updateSession(req.params.sessionId, {
        estado: 'pausado'
      });
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      broadcastToSession(req.params.sessionId, {
        type: 'game_paused'
      });

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to pause game" });
    }
  });

  app.post("/api/game/:sessionId/resume", async (req, res) => {
    try {
      const session = await storage.updateSession(req.params.sessionId, {
        estado: 'activo'
      });
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      broadcastToSession(req.params.sessionId, {
        type: 'game_resumed'
      });

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to resume game" });
    }
  });

  app.post("/api/game/:sessionId/finish", async (req, res) => {
    try {
      const session = await storage.updateSession(req.params.sessionId, {
        estado: 'finalizado',
        fechaFin: new Date()
      });
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      broadcastToSession(req.params.sessionId, {
        type: 'game_finished'
      });

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to finish game" });
    }
  });

  // Player management routes
  app.get("/api/game/:sessionId/players", async (req, res) => {
    try {
      const players = await storage.getPlayersBySession(req.params.sessionId);
      res.json(players);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch players" });
    }
  });

  app.post("/api/game/:sessionId/join", async (req, res) => {
    try {
      const { playerName, uuid } = req.body;
      const carton = generateBingoCard();
      
      const playerData = {
        sessionId: req.params.sessionId,
        playerName,
        uuid,
        carton
      };
      
      const validatedData = insertPlayerSchema.parse(playerData);
      const player = await storage.createPlayer(validatedData);
      
      broadcastToSession(req.params.sessionId, {
        type: 'player_joined',
        player
      });
      
      res.json(player);
    } catch (error) {
      res.status(400).json({ message: "Failed to join game" });
    }
  });

  app.get("/api/card/:uuid", async (req, res) => {
    try {
      const player = await storage.getPlayer(req.params.uuid);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch player card" });
    }
  });

  app.patch("/api/card/:uuid", async (req, res) => {
    try {
      const player = await storage.updatePlayer(req.params.uuid, req.body);
      if (!player) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json(player);
    } catch (error) {
      res.status(500).json({ message: "Failed to update player" });
    }
  });

  // Pattern routes
  app.get("/api/patterns", async (req, res) => {
    try {
      const patterns = await storage.getAllPatterns();
      res.json(patterns);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch patterns" });
    }
  });

  app.post("/api/patterns", async (req, res) => {
    try {
      const validatedData = insertPatternSchema.parse(req.body);
      const pattern = await storage.createPattern(validatedData);
      res.json(pattern);
    } catch (error) {
      res.status(400).json({ message: "Invalid pattern data" });
    }
  });

  // La Mesa Pide route
  app.post("/api/game/:sessionId/mesa-pide", async (req, res) => {
    try {
      const { mensaje } = req.body;
      
      broadcastToSession(req.params.sessionId, {
        type: 'mesa_pide',
        mensaje
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to send mesa pide" });
    }
  });

  return httpServer;
}

function generateNextNumber(drawnNumbers: string[]): string | null {
  const letters = ['B', 'I', 'N', 'G', 'O'];
  const ranges = {
    'B': [1, 15],
    'I': [16, 30], 
    'N': [31, 45],
    'G': [46, 60],
    'O': [61, 75]
  };
  
  const allNumbers: string[] = [];
  for (const letter of letters) {
    const [min, max] = ranges[letter as keyof typeof ranges];
    for (let i = min; i <= max; i++) {
      allNumbers.push(`${letter}-${i}`);
    }
  }
  
  const availableNumbers = allNumbers.filter(num => !drawnNumbers.includes(num));
  
  if (availableNumbers.length === 0) {
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * availableNumbers.length);
  return availableNumbers[randomIndex];
}

function generateBingoCard(): number[][] {
  const card: number[][] = [];
  const ranges = [
    [1, 15],   // B
    [16, 30],  // I
    [31, 45],  // N
    [46, 60],  // G
    [61, 75]   // O
  ];
  
  for (let col = 0; col < 5; col++) {
    const column: number[] = [];
    const [min, max] = ranges[col];
    const usedNumbers = new Set<number>();
    
    for (let row = 0; row < 5; row++) {
      let num: number;
      do {
        num = Math.floor(Math.random() * (max - min + 1)) + min;
      } while (usedNumbers.has(num));
      
      usedNumbers.add(num);
      column.push(num);
    }
    
    card.push(column);
  }
  
  // Transpose to get row-major order
  const transposed: number[][] = [];
  for (let row = 0; row < 5; row++) {
    transposed.push([]);
    for (let col = 0; col < 5; col++) {
      transposed[row][col] = card[col][row];
    }
  }
  
  return transposed;
}
