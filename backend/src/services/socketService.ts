import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

class SocketService {
  private io: Server | null = null;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  /**
   * Initialize Socket.IO server
   */
  initialize(httpServer: HttpServer): Server {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.userId = decoded.userId;

        next();
      } catch (error) {
        next(new Error('Invalid token'));
      }
    });

    // Handle connections
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    console.log('✅ Socket.IO server initialized');
    return this.io;
  }

  /**
   * Handle new socket connection
   */
  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.userId!;

    console.log(`🔌 User connected: ${userId} (${socket.id})`);

    // Store user's socket connection
    this.userSockets.set(userId, socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${userId} (${socket.id})`);
      this.userSockets.delete(userId);
    });

    // Matchmaking events
    socket.on('matchmaking:join', (data: { type: string; language?: string }) => {
      console.log(`🎮 User ${userId} joined ${data.type} matchmaking for ${data.language || 'any language'}`);
      socket.join(`matchmaking:${data.type.toLowerCase()}`);
      if (data.language) {
        socket.join(`matchmaking:${data.type.toLowerCase()}:${data.language.toLowerCase()}`);
      }
    });

    socket.on('matchmaking:leave', () => {
      console.log(`🎮 User ${userId} left matchmaking`);
      socket.leave('matchmaking:ranked');
      socket.leave('matchmaking:casual');
      socket.leave('matchmaking:battle');
      socket.leave('matchmaking:custom');
    });

    // Game events
    socket.on('game:answer_submitted', (data: { matchId: string; questionId: string }) => {
      console.log(`📝 User ${userId} submitted answer for question ${data.questionId} in match ${data.matchId}`);
      // Notify opponent that player submitted an answer
      socket.to(`match:${data.matchId}`).emit('game:opponent_answered', {
        questionId: data.questionId,
      });
    });

    socket.on('game:join_match', (data: { matchId: string }) => {
      console.log(`🎮 User ${userId} joined match ${data.matchId}`);
      socket.join(`match:${data.matchId}`);
    });

    socket.on('game:leave_match', (data: { matchId: string }) => {
      console.log(`🎮 User ${userId} left match ${data.matchId}`);
      socket.leave(`match:${data.matchId}`);
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong');
    });
  }

  /**
   * Emit event to specific user
   */
  emitToUser(userId: string, event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Emit event to multiple users
   */
  emitToUsers(userIds: string[], event: string, data: any): void {
    if (!this.io) return;
    userIds.forEach((userId) => {
      this.io!.to(`user:${userId}`).emit(event, data);
    });
  }

  /**
   * Emit event to matchmaking lobby
   */
  emitToMatchmaking(type: 'RANKED' | 'CASUAL', event: string, data: any): void {
    if (!this.io) return;
    this.io.to(`matchmaking:${type.toLowerCase()}`).emit(event, data);
  }

  /**
   * Broadcast event to all connected clients
   */
  broadcast(event: string, data: any): void {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  /**
   * Get Socket.IO instance
   */
  getIO(): Server | null {
    return this.io;
  }
}

// Export singleton instance
export const socketService = new SocketService();
