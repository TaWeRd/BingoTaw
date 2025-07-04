import { z } from "zod";

// MongoDB Collections Schema
export const UserSchema = z.object({
  _id: z.string().optional(),
  username: z.string(),
  password: z.string(),
});

export const SessionSchema = z.object({
  _id: z.string().optional(),
  sessionId: z.string(),
  creador: z.string(),
  fechaInicio: z.date(),
  fechaFin: z.date().optional(),
  estado: z.enum(['activo', 'pausado', 'finalizado']),
  modalidad: z.string(),
  patronPersonalizado: z.array(z.array(z.boolean())).optional(),
  numeroCartones: z.number().default(25),
  configuracionVoz: z.object({
    voice: z.enum(['lorenzo', 'catalina']),
    speed: z.number(),
    style: z.enum(['entusiasta', 'formal', 'neutral'])
  }).optional(),
  drawnNumbers: z.array(z.string()).default([]),
  ganador: z.string().optional(),
  duracion: z.number().optional(),
  estadisticas: z.any().optional(),
});

export const PlayerSchema = z.object({
  _id: z.string().optional(),
  sessionId: z.string(),
  playerName: z.string(),
  uuid: z.string(),
  carton: z.array(z.array(z.number())),
  numerosMaracados: z.array(z.string()).default([]),
  conectado: z.boolean().default(true),
});

export const GamePatternSchema = z.object({
  _id: z.string().optional(),
  nombre: z.string(),
  descripcion: z.string(),
  patron: z.array(z.array(z.boolean())),
  esPredefinido: z.boolean().default(true),
});

// Insert schemas
export const insertUserSchema = UserSchema.omit({ _id: true });
export const insertSessionSchema = SessionSchema.omit({ _id: true, fechaInicio: true });
export const insertPlayerSchema = PlayerSchema.omit({ _id: true });
export const insertPatternSchema = GamePatternSchema.omit({ _id: true });

// Types
export type User = z.infer<typeof UserSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type GamePattern = z.infer<typeof GamePatternSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertPattern = z.infer<typeof insertPatternSchema>;

// Common types
export type BingoCard = number[][];
export type PatternGrid = boolean[][];
export type DrawnNumber = string;
export type VoiceConfig = {
  voice: 'lorenzo' | 'catalina';
  speed: number;
  style: 'entusiasta' | 'formal' | 'neutral';
};