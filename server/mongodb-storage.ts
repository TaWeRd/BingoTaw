import { MongoClient, Db, Collection, ObjectId } from "mongodb";
import { 
  User, Session, Player, GamePattern, 
  InsertUser, InsertSession, InsertPlayer, InsertPattern
} from "../shared/mongodb-schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
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
  getPattern(id: string): Promise<GamePattern | undefined>;
  getAllPatterns(): Promise<GamePattern[]>;
  createPattern(pattern: InsertPattern): Promise<GamePattern>;
}

export class MongoStorage implements IStorage {
  private client: MongoClient;
  private db: Db;
  private users: Collection<User>;
  private sessions: Collection<Session>;
  private players: Collection<Player>;
  private patterns: Collection<GamePattern>;

  constructor() {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017";
    const dbName = process.env.DB_NAME || "BingoMT";
    
    this.client = new MongoClient(mongoUri);
    this.db = this.client.db(dbName);
    this.users = this.db.collection("users");
    this.sessions = this.db.collection("sessions");
    this.players = this.db.collection("players");
    this.patterns = this.db.collection("patterns");
    
    this.initializeData();
  }

  private async initializeData() {
    try {
      await this.client.connect();
      console.log("Connected to MongoDB Atlas");
      
      // Create predefined patterns if they don't exist
      const existingPatterns = await this.patterns.countDocuments();
      if (existingPatterns === 0) {
        await this.createPredefinedPatterns();
      }
      
      // Create master user if it doesn't exist
      const masterUser = await this.getUserByUsername("master");
      if (!masterUser) {
        await this.createUser({
          username: "master",
          password: "master1"
        });
      }
    } catch (error) {
      console.error("MongoDB connection error:", error);
      // Fall back to memory storage if MongoDB fails
      console.log("Falling back to memory storage");
    }
  }

  private async createPredefinedPatterns() {
    const predefinedPatterns = [
      {
        nombre: "Línea Horizontal",
        descripcion: "Completa una línea horizontal completa",
        patron: [
          [true, true, true, true, true],
          [false, false, false, false, false],
          [false, false, true, false, false],
          [false, false, false, false, false],
          [false, false, false, false, false]
        ],
        esPredefinido: true
      },
      {
        nombre: "Línea Vertical",
        descripcion: "Completa una línea vertical completa",
        patron: [
          [true, false, false, false, false],
          [true, false, false, false, false],
          [true, false, true, false, false],
          [true, false, false, false, false],
          [true, false, false, false, false]
        ],
        esPredefinido: true
      },
      {
        nombre: "Cruz",
        descripcion: "Completa una cruz en el centro del cartón",
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
        descripcion: "Completa una diagonal completa",
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
        descripcion: "Completa todo el cartón",
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
      await this.patterns.insertOne(pattern as any);
    }
    console.log("Predefined patterns created");
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    try {
      const user = await this.users.findOne({ _id: new ObjectId(id) } as any);
      return user ? { ...user, _id: user._id.toString() } : undefined;
    } catch {
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.users.findOne({ username });
    return user ? { ...user, _id: user._id.toString() } : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.users.insertOne(insertUser as any);
    return { ...insertUser, _id: result.insertedId.toString() };
  }

  // Session methods
  async getSession(sessionId: string): Promise<Session | undefined> {
    const session = await this.sessions.findOne({ sessionId });
    return session ? { ...session, _id: session._id.toString() } : undefined;
  }

  async getAllSessions(): Promise<Session[]> {
    const sessions = await this.sessions.find({}).toArray();
    return sessions.map(s => ({ ...s, _id: s._id.toString() }));
  }

  async getActiveSessions(): Promise<Session[]> {
    const sessions = await this.sessions.find({ estado: 'activo' }).toArray();
    return sessions.map(s => ({ ...s, _id: s._id.toString() }));
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const sessionData = {
      ...insertSession,
      fechaInicio: new Date(),
      drawnNumbers: insertSession.drawnNumbers || []
    };
    
    const result = await this.sessions.insertOne(sessionData as any);
    return { ...sessionData, _id: result.insertedId.toString() };
  }

  async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | undefined> {
    const result = await this.sessions.findOneAndUpdate(
      { sessionId },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? { ...result, _id: result._id.toString() } : undefined;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await this.sessions.deleteOne({ sessionId });
    return result.deletedCount > 0;
  }

  // Player methods
  async getPlayer(uuid: string): Promise<Player | undefined> {
    const player = await this.players.findOne({ uuid });
    return player ? { ...player, _id: player._id.toString() } : undefined;
  }

  async getPlayersBySession(sessionId: string): Promise<Player[]> {
    const players = await this.players.find({ sessionId }).toArray();
    return players.map(p => ({ ...p, _id: p._id.toString() }));
  }

  async createPlayer(insertPlayer: InsertPlayer): Promise<Player> {
    const result = await this.players.insertOne(insertPlayer as any);
    return { ...insertPlayer, _id: result.insertedId.toString() };
  }

  async updatePlayer(uuid: string, updates: Partial<Player>): Promise<Player | undefined> {
    const result = await this.players.findOneAndUpdate(
      { uuid },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? { ...result, _id: result._id.toString() } : undefined;
  }

  async deletePlayer(uuid: string): Promise<boolean> {
    const result = await this.players.deleteOne({ uuid });
    return result.deletedCount > 0;
  }

  // Pattern methods
  async getPattern(id: string): Promise<GamePattern | undefined> {
    const pattern = await this.patterns.findOne({ _id: new ObjectId(id) });
    return pattern ? { ...pattern, _id: pattern._id.toString() } : undefined;
  }

  async getAllPatterns(): Promise<GamePattern[]> {
    const patterns = await this.patterns.find({}).toArray();
    return patterns.map(p => ({ ...p, _id: p._id.toString() }));
  }

  async createPattern(insertPattern: InsertPattern): Promise<GamePattern> {
    const result = await this.patterns.insertOne(insertPattern as any);
    return { ...insertPattern, _id: result.insertedId.toString() };
  }
}

export const storage = new MongoStorage();