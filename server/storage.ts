import { 
  users, sessions, players, gamePatterns,
  type User, type InsertUser,
  type Session, type InsertSession,
  type Player, type InsertPlayer,
  type GamePattern, type InsertPattern
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session methods
  getSession(sessionId: string): Promise<Session | undefined>;
  getAllSessions(): Promise<Session[]>;
  getActiveSessions(): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | undefined>;
  deleteSession(sessionId: string): Promise<boolean>;
  
  // Player methods
  getPlayer(uuid: string): Promise<Player | undefined>;
  getPlayersBySession(sessionId: string): Promise<Player[]>;
  createPlayer(player: InsertPlayer): Promise<Player>;
  updatePlayer(uuid: string, updates: Partial<Player>): Promise<Player | undefined>;
  deletePlayer(uuid: string): Promise<boolean>;
  
  // Pattern methods
  getPattern(id: number): Promise<GamePattern | undefined>;
  getAllPatterns(): Promise<GamePattern[]>;
  createPattern(pattern: InsertPattern): Promise<GamePattern>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;
  private players: Map<string, Player>;
  private patterns: Map<number, GamePattern>;
  private currentUserId: number;
  private currentSessionId: number;
  private currentPlayerId: number;
  private currentPatternId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.players = new Map();
    this.patterns = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentPlayerId = 1;
    this.currentPatternId = 1;
    
    // Initialize with master user
    this.createUser({ username: "master", password: "master1" });
    
    // Initialize with predefined patterns
    this.initializePredefinedPatterns();
  }

  private async initializePredefinedPatterns() {
    const predefinedPatterns = [
      {
        nombre: "Línea Horizontal",
        descripcion: "Complete una línea horizontal completa",
        patron: [
          [true, true, true, true, true],
          [false, false, false, false, false],
          [false, false, false, false, false],
          [false, false, false, false, false],
          [false, false, false, false, false]
        ],
        esPredefinido: true
      },
      {
        nombre: "Línea Vertical",
        descripcion: "Complete una línea vertical completa",
        patron: [
          [true, false, false, false, false],
          [true, false, false, false, false],
          [true, false, false, false, false],
          [true, false, false, false, false],
          [true, false, false, false, false]
        ],
        esPredefinido: true
      },
      {
        nombre: "Cruz",
        descripcion: "Complete una cruz en el centro del cartón",
        patron: [
          [false, false, true, false, false],
          [false, false, true, false, false],
          [true, true, true, true, true],
          [false, false, true, false, false],
          [false, false, true, false, false]
        ],
        esPredefinido: true
      },
      {
        nombre: "Diagonal",
        descripcion: "Complete una diagonal completa",
        patron: [
          [true, false, false, false, false],
          [false, true, false, false, false],
          [false, false, true, false, false],
          [false, false, false, true, false],
          [false, false, false, false, true]
        ],
        esPredefinido: true
      },
      {
        nombre: "Cartón Lleno",
        descripcion: "Complete todo el cartón",
        patron: [
          [true, true, true, true, true],
          [true, true, true, true, true],
          [true, true, true, true, true],
          [true, true, true, true, true],
          [true, true, true, true, true]
        ],
        esPredefinido: true
      }
    ];

    for (const pattern of predefinedPatterns) {
      await this.createPattern(pattern);
    }
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Session methods
  async getSession(sessionId: string): Promise<Session | undefined> {
    return this.sessions.get(sessionId);
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async getActiveSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter(s => s.estado === 'activo' || s.estado === 'pausado');
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = {
      ...insertSession,
      id,
      fechaInicio: new Date(),
      fechaFin: null,
      estado: insertSession.estado || 'activo',
      patronPersonalizado: insertSession.patronPersonalizado || null,
      numeroCartones: insertSession.numeroCartones || 25,
      configuracionVoz: insertSession.configuracionVoz || null,
      drawnNumbers: [],
      ganador: null,
      duracion: null,
      estadisticas: null
    };
    this.sessions.set(session.sessionId, session);
    return session;
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(sessionId, updatedSession);
    return updatedSession;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  // Player methods
  async getPlayer(uuid: string): Promise<Player | undefined> {
    return this.players.get(uuid);
  }

  async getPlayersBySession(sessionId: string): Promise<Player[]> {
    return Array.from(this.players.values()).filter(p => p.sessionId === sessionId);
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const id = this.currentPlayerId++;
    const player: Player = {
      ...insertPlayer,
      id,
      numerosMaracados: [],
      conectado: true
    };
    this.players.set(player.uuid, player);
    return player;
  }

  async updatePlayer(uuid: string, updates: Partial<Player>): Promise<Player | undefined> {
    const player = this.players.get(uuid);
    if (!player) return undefined;
    
    const updatedPlayer = { ...player, ...updates };
    this.players.set(uuid, updatedPlayer);
    return updatedPlayer;
  }

  async deletePlayer(uuid: string): Promise<boolean> {
    return this.players.delete(uuid);
  }

  // Pattern methods
  async getPattern(id: number): Promise<GamePattern | undefined> {
    return this.patterns.get(id);
  }

  async getAllPatterns(): Promise<GamePattern[]> {
    return Array.from(this.patterns.values());
  }

  async createPattern(insertPattern: InsertPattern): Promise<GamePattern> {
    const id = this.currentPatternId++;
    const pattern: GamePattern = { 
      ...insertPattern, 
      id,
      esPredefinido: insertPattern.esPredefinido ?? true
    };
    this.patterns.set(id, pattern);
    return pattern;
  }
}

export const storage = new MemStorage();
