import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  creador: text("creador").notNull(),
  fechaInicio: timestamp("fecha_inicio").notNull().defaultNow(),
  fechaFin: timestamp("fecha_fin"),
  estado: text("estado").notNull().default("activo"), // activo, pausado, finalizado
  modalidad: text("modalidad").notNull(),
  patronPersonalizado: jsonb("patron_personalizado"),
  numeroCartones: integer("numero_cartones").notNull().default(25),
  configuracionVoz: jsonb("configuracion_voz"),
  drawnNumbers: text("drawn_numbers").array().default([]),
  ganador: text("ganador"),
  duracion: integer("duracion"), // in seconds
  estadisticas: jsonb("estadisticas"),
});

export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  playerName: text("player_name").notNull(),
  uuid: text("uuid").notNull().unique(),
  carton: jsonb("carton").notNull(),
  numerosMaracados: text("numeros_marcados").array(),
  conectado: boolean("conectado").notNull().default(true),
});

export const gamePatterns = pgTable("game_patterns", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion").notNull(),
  patron: jsonb("patron").notNull(), // 5x5 grid pattern
  esPredefinido: boolean("es_predefinido").notNull().default(true),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  fechaInicio: true,
  fechaFin: true,
});

export const insertPlayerSchema = createInsertSchema(players).omit({
  id: true,
});

export const insertPatternSchema = createInsertSchema(gamePatterns).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;
export type InsertPattern = z.infer<typeof insertPatternSchema>;
export type GamePattern = typeof gamePatterns.$inferSelect;

// Additional types for game logic
export type BingoCard = number[][];
export type PatternGrid = boolean[][];
export type DrawnNumber = string;
export type VoiceConfig = {
  voice: 'lorenzo' | 'catalina';
  speed: number;
  style: 'entusiasta' | 'formal' | 'neutral';
};
