import { Server, WebSocket } from 'ws';
import * as url from 'url';
import { AppDataSource } from '../config/data-source';
import { Structure } from '../entities/Structure';
import { Room } from '../entities/Room';
import { haversine } from '../services/internalRoutePathfinding';

interface ClientMessage {
  position: number[];
  structureId?: number;
  floor?: number;
}

interface ClientData {
  ws: WebSocket;
  roomId: string;
}

class WebSocketManager {
  private rooms = new Map<string, Set<WebSocket>>();

  addClient(roomId: string, ws: WebSocket): void {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId)!.add(ws);
  }

  removeClient(roomId: string, ws: WebSocket): void {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  broadcast(roomId: string, data: any): void {
    const room = this.rooms.get(roomId);
    if (room) {
      const message = JSON.stringify(data);
      room.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }
}

class LocationService {
  async findNearestStructure(position: number[]): Promise<Structure | null> {
    const structures = await AppDataSource.getRepository(Structure).find();
    
    let nearest: Structure | null = null;
    let minDistance = Infinity;

    for (const structure of structures) {
      if (structure.centroid?.coordinates) {
        const distance = haversine(position, structure.centroid.coordinates);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = structure;
        }
      }
    }

    return nearest;
  }

  async getRoomsByFloor(structureId: number, floor: number): Promise<Room[]> {
    return AppDataSource.getRepository(Room).find({
      where: { 
        structure: { id: structureId }, 
        floor 
      }
    });
  }
}

export function setupUserDistanceSocket(server: any): void {
  const wss = new Server({ server });
  const manager = new WebSocketManager();
  const locationService = new LocationService();

  wss.on('connection', (ws: WebSocket, req) => {
    const roomId = extractRoomId(req.url);
    manager.addClient(roomId, ws);


    ws.on('close', () => {
      manager.removeClient(roomId, ws);
    });

    ws.on('message', async (message) => {
      try {
        const data: ClientMessage = JSON.parse(message.toString());
        await handleClientMessage(ws, data, locationService);
      } catch (error) {
        sendError(ws, 'Mensagem inválida');
      }
    });
  });
}

function extractRoomId(urlString?: string): string {
  if (!urlString) return 'default';
  const parsed = url.parse(urlString, true);
  return (parsed.query.room as string) || 'default';
}

async function handleClientMessage(
  ws: WebSocket,
  data: ClientMessage,
  service: LocationService
): Promise<void> {
  const { position, structureId, floor } = data;

  if (!position || !Array.isArray(position) || position.length !== 2) {
    sendError(ws, 'Posição inválida');
    return;
  }

  if (!structureId) {
    await handleNearestStructure(ws, position, floor, service);
    return;
  }

  if (floor !== undefined && floor !== null) {
    await handleRoomsByFloor(ws, structureId, floor, service);
  }
}

async function handleNearestStructure(
  ws: WebSocket,
  position: number[],
  floor: number | undefined,
  service: LocationService
): Promise<void> {
  const nearest = await service.findNearestStructure(position);
  
  if (!nearest) {
    sendError(ws, 'Nenhuma estrutura próxima encontrada');
    return;
  }

  sendMessage(ws, {
    type: 'nearestStructure',
    structure: nearest
  });

  if (floor !== undefined && floor !== null) {
    await handleRoomsByFloor(ws, nearest.id, floor, service);
  }
}

async function handleRoomsByFloor(
  ws: WebSocket,
  structureId: number,
  floor: number,
  service: LocationService
): Promise<void> {
  const rooms = await service.getRoomsByFloor(structureId, floor);
  
  sendMessage(ws, {
    type: 'roomsOnFloor',
    rooms,
    structureId,
    floor
  });
}

function sendMessage(ws: WebSocket, data: any): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendError(ws: WebSocket, message: string): void {
  sendMessage(ws, { type: 'error', message });
}