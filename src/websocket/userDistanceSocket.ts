import { Server } from 'ws';
import * as url from 'url';
import { haversine } from '../services/internalRoutePathfinding';
import { AppDataSource } from '../config/data-source';
import { Structure } from '../entities/Structure';
import { Room } from '../entities/Room';

async function findNearestStructure(position: number[]): Promise<Structure | null> {
  const repo = AppDataSource.getRepository(Structure);
  const all = await repo.find();
  let minDist = Infinity;
  let nearest: Structure | null = null;
  for (const s of all) {
    if (s.centroid && s.centroid.coordinates) {
      const dist = haversine(position, s.centroid.coordinates);
      if (dist < minDist) {
        minDist = dist;
        nearest = s;
      }
    }
  }
  return nearest;
}

async function getRoomsByFloor(structureId: number, floor: number): Promise<Room[]> {
  const repo = AppDataSource.getRepository(Room);
  return repo.find({ where: { structure: { id: structureId }, floor } });
}

export function setupUserDistanceSocket(server: any) {
  const wss = new Server({ server });
  const rooms: Map<string, Set<any>> = new Map();

  wss.on('connection', (ws, req) => {
    const parsedUrl = url.parse(req.url || '', true);
    const roomId = parsedUrl.query.room as string || 'default';
    if (!rooms.has(roomId)) rooms.set(roomId, new Set());
    rooms.get(roomId)!.add(ws);

    ws.on('close', () => {
      rooms.get(roomId)!.delete(ws);
      if (rooms.get(roomId)!.size === 0) rooms.delete(roomId);
    });

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        const position = data.position;
        const structureId = data.structureId;
        const floor = data.floor;

        if (!structureId) {
          const nearest = await findNearestStructure(position);
          if (nearest) {
            ws.send(JSON.stringify({ type: 'nearestStructure', structure: nearest }));
            if (floor != null) {
              const roomsList = await getRoomsByFloor(nearest.id, floor);
              ws.send(JSON.stringify({ type: 'roomsOnFloor', rooms: roomsList, structureId: nearest.id, floor }));
            }
          }
        } else if (structureId && floor != null) {
          const roomsList = await getRoomsByFloor(structureId, floor);
          ws.send(JSON.stringify({ type: 'roomsOnFloor', rooms: roomsList, structureId, floor }));
        }
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid data' }));
      }
    });
  });
}
