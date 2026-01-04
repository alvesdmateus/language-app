# WebSocket Real-Time Features

## Overview

The language learning app uses **Socket.IO** for real-time communication between the server and clients. This enables instant matchmaking updates, live notifications, and real-time game events.

## Architecture

```
┌─────────────────┐         WebSocket          ┌─────────────────┐
│   Mobile App    │ ◄──────────────────────► │  Backend Server │
│  (Socket.IO     │                           │   (Socket.IO    │
│    Client)      │                           │     Server)     │
└─────────────────┘                           └─────────────────┘
        │                                              │
        │                                              │
        ├── matchmaking:join                          │
        ├── matchmaking:leave                         │
        │                                              │
        ◄── matchmaking:joined ─────────────────────┤
        ◄── matchmaking:lobby_update ───────────────┤
        ◄── matchmaking:match_found ────────────────┤
        ◄── matchmaking:left ───────────────────────┤
```

## Technology Stack

- **Backend**: Socket.IO v4.7.2 (Node.js)
- **Mobile**: socket.io-client v4.7.2 (React Native)
- **Authentication**: JWT tokens
- **Transport**: WebSocket (with fallback to long-polling)

## Backend Implementation

### 1. Socket Service (backend/src/services/socketService.ts)

The `SocketService` class manages all WebSocket connections and events:

```typescript
import { socketService } from './services/socketService';

// Initialize during server startup
socketService.initialize(httpServer);

// Emit to specific user
socketService.emitToUser(userId, 'event_name', data);

// Emit to multiple users
socketService.emitToUsers([userId1, userId2], 'event_name', data);

// Broadcast to matchmaking lobby
socketService.emitToMatchmaking('RANKED', 'event_name', data);

// Broadcast to all clients
socketService.broadcast('event_name', data);
```

### 2. Authentication

All WebSocket connections require JWT authentication:

```typescript
// Client sends token during connection
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  socket.userId = decoded.userId;
  next();
});
```

### 3. Connection Management

- **Personal Rooms**: Each user automatically joins `user:{userId}`
- **Matchmaking Rooms**: Players join `matchmaking:ranked` or `matchmaking:casual`
- **Auto-cleanup**: Disconnected users are automatically removed from lobbies

## WebSocket Events

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `matchmaking:join` | `{ type: 'RANKED'\|'CASUAL' }` | Join matchmaking lobby |
| `matchmaking:leave` | - | Leave matchmaking lobby |
| `ping` | - | Connection health check |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `matchmaking:joined` | `{ matchType, lobbyStatus }` | Confirmed join to lobby |
| `matchmaking:left` | `{ matchType }` | Confirmed leave from lobby |
| `matchmaking:lobby_update` | `{ lobbyStatus }` | Real-time lobby status updates |
| `matchmaking:match_found` | `{ matchId, participants, questions }` | Match found! |
| `pong` | - | Response to ping |

### Event Payloads

**lobbyStatus:**
```json
{
  "totalPlayers": 10,
  "rankedPlayers": 6,
  "casualPlayers": 4
}
```

**match_found:**
```json
{
  "matchId": "uuid",
  "matchType": "RANKED",
  "status": "IN_PROGRESS",
  "questions": [...],
  "participants": [
    {
      "id": "user-id-1",
      "username": "alice",
      "displayName": "Alice",
      "eloRating": 1200,
      "division": "SILVER"
    },
    {
      "id": "user-id-2",
      "username": "bob",
      "displayName": "Bob",
      "eloRating": 1180,
      "division": "SILVER"
    }
  ],
  "startedAt": "2025-01-01T00:00:00.000Z"
}
```

## Mobile Implementation

### 1. WebSocket Context (mobile/src/context/WebSocketContext.tsx)

Manages WebSocket connection lifecycle and provides hooks:

```typescript
import { useWebSocket } from '../context/WebSocketContext';

const { socket, connected, joinMatchmaking, leaveMatchmaking } = useWebSocket();

// Join matchmaking
joinMatchmaking('RANKED');

// Leave matchmaking
leaveMatchmaking();

// Listen to events
useEffect(() => {
  if (!socket) return;

  socket.on('matchmaking:match_found', (data) => {
    console.log('Match found!', data);
  });

  return () => {
    socket.off('matchmaking:match_found');
  };
}, [socket]);
```

### 2. Connection States

- **Disconnected**: Initial state, not connected
- **Connecting**: Attempting to establish connection
- **Connected**: Active connection established
- **Reconnecting**: Lost connection, attempting to reconnect

### 3. Auto-Reconnection

Socket.IO automatically handles reconnection:

```typescript
reconnection: true,
reconnectionDelay: 1000,
reconnectionDelayMax: 5000,
reconnectionAttempts: 5
```

## Matchmaking Flow with WebSockets

### 1. User Joins Matchmaking

```
User clicks "Find Match"
    ↓
Mobile: emit('matchmaking:join', { type: 'RANKED' })
    ↓
Mobile: Call API /api/match/find
    ↓
Server: Add to lobby, emit('matchmaking:joined')
    ↓
Mobile: Display "Searching..." with lobby stats
```

### 2. Lobby Updates

```
Another user joins/leaves
    ↓
Server: emit('matchmaking:lobby_update') to all in lobby
    ↓
Mobile: Update lobby status display
```

### 3. Match Found

```
Server finds suitable opponent
    ↓
Server: Create match in database
    ↓
Server: emit('matchmaking:match_found') to both players
    ↓
Mobile: Show "Match Found!" alert
    ↓
Mobile: Navigate to match screen
```

### 4. User Cancels Search

```
User clicks "Cancel Search"
    ↓
Mobile: emit('matchmaking:leave')
    ↓
Mobile: Call API /api/match/leave
    ↓
Server: Remove from lobby, emit('matchmaking:left')
    ↓
Mobile: Return to matchmaking menu
```

## Connection Monitoring

### Health Check Endpoint

```bash
GET /health

Response:
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "websocket": {
    "connected": 42
  }
}
```

### Ping/Pong

Clients can check connection health:

```typescript
socket.emit('ping');
socket.on('pong', () => {
  console.log('Connection healthy');
});
```

## Error Handling

### Connection Errors

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
  // Show offline indicator
});
```

### Authentication Errors

```typescript
// Invalid or expired token
socket.on('connect_error', (error) => {
  if (error.message === 'Invalid token') {
    // Redirect to login
  }
});
```

### Timeout Handling

Users are automatically removed from matchmaking after 60 seconds:

```typescript
private readonly MATCH_TIMEOUT = 60000; // 60 seconds

private cleanupOldLobbies(): void {
  const now = Date.now();
  for (const [userId, player] of this.lobbies.entries()) {
    if (now - player.joinedAt.getTime() > this.MATCH_TIMEOUT) {
      this.lobbies.delete(userId);
    }
  }
}
```

## Production Considerations

### 1. Scaling

For production with multiple servers:

- Use **Redis adapter** for Socket.IO
- Share lobby state across servers
- Implement sticky sessions

```typescript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### 2. Rate Limiting

Prevent event spam:

```typescript
const rateLimiter = new Map();

socket.use((packet, next) => {
  const userId = socket.userId;
  const now = Date.now();
  const userLimit = rateLimiter.get(userId) || { count: 0, resetAt: now + 1000 };

  if (now > userLimit.resetAt) {
    userLimit.count = 0;
    userLimit.resetAt = now + 1000;
  }

  if (userLimit.count > 10) {
    return next(new Error('Rate limit exceeded'));
  }

  userLimit.count++;
  rateLimiter.set(userId, userLimit);
  next();
});
```

### 3. Monitoring

Track WebSocket metrics:

- Connected users count
- Event rates
- Average connection duration
- Reconnection frequency

### 4. Security

- **Always validate JWT tokens**
- **Sanitize event data**
- **Implement rate limiting**
- **Use TLS/SSL in production**

## Testing

### Backend Tests

```bash
# Install testing dependencies
npm install --save-dev @types/socket.io-client

# Test WebSocket connection
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'test-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected!');
});
```

### Mobile Tests

```typescript
// Test event handlers
const mockSocket = {
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
};

// Test matchmaking flow
mockSocket.emit('matchmaking:join', { type: 'RANKED' });
expect(mockSocket.emit).toHaveBeenCalledWith('matchmaking:join', { type: 'RANKED' });
```

## Debugging

### Enable Debug Logs

**Backend:**
```bash
DEBUG=socket.io* npm run dev
```

**Mobile:**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token },
  transports: ['websocket'],
  debug: true, // Enable debug logs
});
```

### Common Issues

**1. Connection refused:**
- Check if backend server is running
- Verify correct API_URL in mobile app
- Check firewall settings

**2. Authentication failed:**
- Verify JWT token is valid
- Check token expiration
- Ensure token is sent in auth handshake

**3. Events not received:**
- Verify event names match exactly
- Check if socket is connected
- Ensure user is in correct room

## Future Enhancements

- **Real-time chat** during matches
- **Live spectator mode** for matches
- **Push notifications** via WebSocket
- **Typing indicators** in chat
- **Live leaderboard updates**
- **Friend online/offline status**
- **Real-time quiz competitions**

## API Reference

### socketService Methods

```typescript
// Initialize Socket.IO server
initialize(httpServer: HttpServer): Server

// Emit to specific user
emitToUser(userId: string, event: string, data: any): void

// Emit to multiple users
emitToUsers(userIds: string[], event: string, data: any): void

// Emit to matchmaking lobby
emitToMatchmaking(type: 'RANKED'|'CASUAL', event: string, data: any): void

// Broadcast to all clients
broadcast(event: string, data: any): void

// Get connected users count
getConnectedUsersCount(): number

// Check if user is connected
isUserConnected(userId: string): boolean
```

## Summary

WebSocket integration provides:

✅ **Real-time matchmaking** - Instant opponent notifications
✅ **Live lobby updates** - See player counts in real-time
✅ **Connection resilience** - Auto-reconnection on failure
✅ **Scalable architecture** - Ready for Redis adapter
✅ **Secure authentication** - JWT-based connection auth
✅ **Production-ready** - Error handling and rate limiting

The WebSocket system ensures a smooth, responsive matchmaking experience for all players!
