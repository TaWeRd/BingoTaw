# BingoMT - Real-time Bingo Gaming Platform

## Overview

BingoMT is a comprehensive real-time bingo gaming platform built with React frontend and Express backend. The application provides a complete bingo gaming experience with Chilean TTS integration, real-time WebSocket communication, and a sophisticated game master control system. The platform supports multiple game sessions, custom patterns, and real-time player interaction.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom Chilean-themed color scheme
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Communication**: WebSocket integration for live game updates

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database serverless PostgreSQL
- **Real-time**: WebSocket server for bidirectional communication
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### Build System
- **Frontend Build**: Vite with React plugin
- **Backend Build**: esbuild for server bundling
- **Development**: Hot module replacement with Vite dev server
- **TypeScript**: Shared type definitions across frontend/backend

## Key Components

### Authentication System
- Simple master/admin authentication
- Session-based authentication with PostgreSQL storage
- Protected routes for game master dashboard

### Game Session Management
- Complete CRUD operations for bingo sessions
- Session states: active, paused, finished
- Configurable game patterns (predefined and custom)
- Voice configuration with Chilean TTS integration

### Real-time Gaming Engine
- WebSocket-based real-time communication
- Automatic number drawing with configurable speed
- Live bingo validation and winner detection
- Player card management and marking

### Pattern System
- Predefined bingo patterns (lines, full card, etc.)
- Custom pattern editor with visual grid interface
- Pattern validation and description system

### Voice Integration
- Chilean TTS with multiple voice options (Lorenzo/Catalina)
- Configurable speech rate and style
- Automatic number announcement
- Pattern description reading

## Data Flow

1. **Game Setup**: Master creates session through wizard interface
2. **Player Join**: Players access game via unique URLs and select cards
3. **Game Control**: Master controls number drawing, game state, and announcements
4. **Real-time Updates**: All clients receive live updates via WebSocket
5. **Bingo Validation**: Server validates bingo claims against drawn numbers
6. **Game Completion**: Automatic winner detection and game statistics

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect
- **@tanstack/react-query**: Server state management
- **ws**: WebSocket implementation for real-time communication
- **connect-pg-simple**: PostgreSQL session store

### UI Dependencies
- **@radix-ui/***: Comprehensive UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Type-safe component variants
- **lucide-react**: Icon library

### Development Dependencies
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- Vite dev server with HMR for frontend
- tsx for TypeScript execution in development
- Automatic database schema sync with Drizzle

### Production Build
- Frontend: Vite build to static assets
- Backend: esbuild bundle to single executable
- Database: Drizzle migrations for schema management

### Environment Configuration
- DATABASE_URL: PostgreSQL connection string
- NODE_ENV: Environment detection
- Session configuration for production security

## Changelog

```
Changelog:
- June 28, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```