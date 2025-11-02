import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { findShortestInternalRoute, haversine } from './internalRoutePathfinding';
import { Room } from '../entities/Room';
import { Structure } from '../entities/Structure';
import { In } from 'typeorm';

export class InternalRouteService {
 

  /**
   * Find shortest route, supporting multi-floor navigation using stairs.
   * If start and destination are on different floors, finds path to nearest stairs, then from stairs on target floor to destination.
   */
  /**
   * Find shortest route, supporting multi-floor navigation using stairs.
   * Returns separated paths for each floor for progressive display.
   */
  async findShortestRouteToDestination(
    structureId: number,
    startFloor: number,
    start: number[],
    roomId?: number
  ): Promise<
    | { 
        pathToStairs: number[][]; 
        stairsTransition: { from: number[]; to: number[] }; 
        pathFromStairs: number[][]; 
        destinationFloor: number; 
        availableFloors: number[];
        floorPaths: { floor: number; path: number[][] }[];
        stairTransitions: { from: number[]; to: number[]; fromFloor: number; toFloor: number }[];
        structure: any;
        roomsByFloor: { [floor: number]: any[] };
      }
    | { path: number[][] }
    | null
  > {
    const end = await this.getDestinationCoords(roomId, structureId);
    if (!end) {
   
      return null;
    }

    // Find destination room and its floor
    let destFloor = startFloor;
    if (roomId) {
      const roomRepo = AppDataSource.getRepository(Room);
      const room = await roomRepo.findOne({ where: { id: Number(roomId) } });
      if (room && typeof room.floor === 'number') destFloor = room.floor;
    }

    if (startFloor === destFloor) {
      const routes = await this.getRoutesByStructure(structureId, startFloor);
      const path = await this.findShortestRoute(structureId, startFloor, start, end);
      return { path };
    }

    // Buscar todos os andares disponíveis da estrutura
    const allFloorsData = await this.routeRepo
      .createQueryBuilder('route')
      .select('DISTINCT route.floor', 'floor')
      .where('route.structureId = :structureId', { structureId })
      .orderBy('route.floor', 'ASC')
      .getRawMany();
    
    const allAvailableFloors = allFloorsData.map(f => f.floor).sort((a, b) => a - b);

    // Determinar direção (subindo ou descendo)
    const isGoingUp = startFloor < destFloor;
    
    // Filtrar apenas os andares entre o início e o destino (inclusive) que têm rotas
    const floorsInRoute = allAvailableFloors.filter(floor => 
      isGoingUp 
        ? floor >= startFloor && floor <= destFloor
        : floor <= startFloor && floor >= destFloor
    );

    if (floorsInRoute.length < 2) {
      console.log('Not enough floors in route');
      return null;
    }

    // Arrays para armazenar todos os segmentos da rota
    const floorPaths: { floor: number; path: number[][] }[] = [];
    const stairTransitions: { from: number[]; to: number[]; fromFloor: number; toFloor: number }[] = [];

    // Percorrer cada andar no caminho
    for (let i = 0; i < floorsInRoute.length; i++) {
      const currentFloor = floorsInRoute[i];
      const isFirstFloor = i === 0;
      const isLastFloor = i === floorsInRoute.length - 1;

      // Primeiro andar: rota do ponto inicial até a escada
      if (isFirstFloor) {
        const stairsCurrentFloor = await this.getStairs(structureId, currentFloor);
        if (!stairsCurrentFloor.length) {
          return null;
        }

        const nearestStair = this.findNearestStair(stairsCurrentFloor, start);
        if (!nearestStair) return null;

        const pathToStair = await this.findShortestRoute(structureId, currentFloor, start, nearestStair);
        if (!pathToStair) return null;

        floorPaths.push({ floor: currentFloor, path: pathToStair });

        // Se não é o último andar, criar transição
        if (!isLastFloor) {
          const nextFloor = floorsInRoute[i + 1];
          const stairsNextFloor = await this.getStairs(structureId, nextFloor);
          
          if (!stairsNextFloor.length) {
            console.log(`No stairs found on floor ${nextFloor}`);
            return null;
          }

          const stairOnNextFloor = this.findNearestStair(stairsNextFloor, nearestStair);
          if (!stairOnNextFloor) return null;

          stairTransitions.push({
            from: nearestStair,
            to: stairOnNextFloor,
            fromFloor: currentFloor,
            toFloor: nextFloor
          });
        }
      }
      // Último andar: escada até o destino
      else if (isLastFloor) {
        const entryPoint = stairTransitions[stairTransitions.length - 1].to;
        const pathToDestination = await this.findShortestRoute(structureId, currentFloor, entryPoint, end);
        if (!pathToDestination) return null;

        floorPaths.push({ floor: currentFloor, path: pathToDestination });
      }
      // Andares intermediários: escada → escada
      else {
        const stairsCurrentFloor = await this.getStairs(structureId, currentFloor);
        const nextFloor = floorsInRoute[i + 1];
        const stairsNextFloor = await this.getStairs(structureId, nextFloor);

        if (!stairsCurrentFloor.length || !stairsNextFloor.length) {
          console.log(`No stairs found between floor ${currentFloor} and ${nextFloor}`);
          return null;
        }

        // Ponto de entrada é a escada do andar anterior
        const entryPoint = stairTransitions[stairTransitions.length - 1].to;
        
        // Se as escadas são no mesmo local (comum em prédios), 
        // apenas registrar o ponto sem tentar calcular rota
        const distance = haversine(entryPoint, stairsCurrentFloor[0]);
        const isSameStairLocation = distance < 0.002; // Menos de 2 metros (~0.002 graus) = mesma escada
        
        if (isSameStairLocation) {
          // Escadas no mesmo lugar, apenas passar direto
          floorPaths.push({ floor: currentFloor, path: [entryPoint] });
          
          // Transição para o próximo andar
          const stairOnNextFloor = this.findNearestStair(stairsNextFloor, entryPoint);
          if (!stairOnNextFloor) return null;

          stairTransitions.push({
            from: entryPoint,
            to: stairOnNextFloor,
            fromFloor: currentFloor,
            toFloor: nextFloor
          });
        } else {
          // Escadas em locais diferentes, calcular rota de travessia
          const nextStair = this.findNearestStair(stairsCurrentFloor, entryPoint);
          if (!nextStair) return null;

          const pathAcrossFloor = await this.findShortestRoute(structureId, currentFloor, entryPoint, nextStair);
          if (!pathAcrossFloor) return null;

          floorPaths.push({ floor: currentFloor, path: pathAcrossFloor });

          // Escada para o próximo andar
          const stairOnNextFloor = this.findNearestStair(stairsNextFloor, nextStair);
          if (!stairOnNextFloor) return null;

          stairTransitions.push({
            from: nextStair,
            to: stairOnNextFloor,
            fromFloor: currentFloor,
            toFloor: nextFloor
          });
        }
      }
    }

  
    const structureRepo = AppDataSource.getRepository(Structure);
    const roomRepo = AppDataSource.getRepository(Room);
    
    console.log(`🔍 [InternalRouteService] Buscando estrutura com ID: ${structureId}`);
    const structure = await structureRepo.findOne({ 
      where: { id: structureId },
      select: ['id', 'name', 'floors', 'centroid', 'geometry']
    });

    // Buscar rooms de todos os andares da rota
    const rooms = await roomRepo.find({
      where: {
        structure: { id: structureId },
        floor: In(floorsInRoute)
      },
      select: ['id', 'name', 'floor', 'centroid', 'geometry'] // ✅ ADICIONADO: geometry
    });

    // Agrupar rooms por andar
    const roomsByFloor: { [floor: number]: any[] } = {};
    for (const floor of floorsInRoute) {
      roomsByFloor[floor] = rooms.filter(r => r.floor === floor);
    }

    return {
      pathToStairs: floorPaths[0].path,
      stairsTransition: stairTransitions[0], // Mantém compatibilidade com frontend atual
      pathFromStairs: floorPaths[floorPaths.length - 1].path,
      destinationFloor: destFloor,
      availableFloors: floorsInRoute, // Apenas os andares pelos quais a rota passa
      floorPaths, // Array completo com todas as rotas por andar
      stairTransitions, // Array completo com todas as transições de escada
      structure, // ✅ NOVO: Informações da estrutura
      roomsByFloor, // ✅ NOVO: Rooms organizados por andar
    };
  }

  /** Get all stairs nodes (as coordinates) for a given structure and floor */
  async getStairs(structureId: number, floor: number): Promise<number[][]> {
    const routes = await this.getRoutesByStructure(structureId, floor);
    const stairs: number[][] = [];
    for (const route of routes) {
      if (route.properties && route.properties.isStairs) {
        // Use all coordinates in the MultiLineString as possible stair nodes
        const lines = route.geometry.coordinates;
        for (const line of lines) {
          for (const coord of line) {
            stairs.push(coord);
          }
        }
      }
    }
    return stairs;
  }

  /** Find the stair node closest to a given point */
  findNearestStair(stairs: number[][], point: number[]): number[] | null {
    let minDist = Infinity;
    let nearest: number[] | null = null;
    for (const stair of stairs) {
      const dist = haversine(stair, point);
      if (dist < minDist) {
        minDist = dist;
        nearest = stair;
      }
    }
    return nearest;
  }

  private routeRepo = AppDataSource.getRepository(InternalRoute);

  async createRoute(data: Partial<InternalRoute>) {
    return await this.routeRepo.save(this.routeRepo.create(data));
  }

  async getRoutesByStructure(structureId: number, floor?: number) {
    const where: any = { structure: { id: structureId } };
    if (floor !== undefined) where.floor = floor;
    return await this.routeRepo.find({ where, relations: ['structure'] });
  }

  async getAllRoutes() {
    return await this.routeRepo.find({ relations: ['structure'] });
  }

  async findShortestRoute(structureId: number, floor: number, start: number[], end: number[]) {
    const routes = await this.getRoutesByStructure(structureId, floor);
    return findShortestInternalRoute(routes, start, end);
  }

   async getDestinationCoords(roomId?: number, structureId?: number): Promise<number[] | null> {
    if (roomId) {
      const roomRepo = AppDataSource.getRepository(Room);
      const room = await roomRepo.findOne({ where: { id: Number(roomId) } });
      console.log('getDestinationCoords - room:', room);
      if (!room || !room.centroid) {
        console.log('getDestinationCoords - room not found or centroid missing');
        return null;
      }
      let centroid = room.centroid;
      if (typeof centroid === 'string') {
        try {
          centroid = JSON.parse(centroid);
        } catch (e) {
          console.log('getDestinationCoords - centroid parse error:', centroid);
          return null;
        }
      }
      console.log('getDestinationCoords - centroid:', centroid);
      if (centroid.type === 'Point') {
        return centroid.coordinates;
      } else if (centroid.type === 'Polygon' && Array.isArray(centroid.coordinates)) {
        const poly = centroid.coordinates[0];
        const avg = poly.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]);
        return [avg[0]/poly.length, avg[1]/poly.length];
      }
      console.log('getDestinationCoords - centroid type not handled:', centroid.type);
      return null;
    } else if (structureId) {
      const structureRepo = AppDataSource.getRepository(Structure);
      const structure = await structureRepo.findOne({ where: { id: Number(structureId) } });
      console.log('getDestinationCoords - structure:', structure);
      if (!structure || !structure.centroid) {
        console.log('getDestinationCoords - structure not found or centroid missing');
        return null;
      }
      let centroid = structure.centroid;
      if (typeof centroid === 'string') {
        try {
          centroid = JSON.parse(centroid);
        } catch (e) {
          console.log('getDestinationCoords - structure centroid parse error:', centroid);
          return null;
        }
      }
      console.log('getDestinationCoords - structure centroid:', centroid);
      if (centroid.type === 'Point') {
        return centroid.coordinates;
      } else if (centroid.type === 'Polygon' && Array.isArray(centroid.coordinates)) {
        const poly = centroid.coordinates[0];
        const avg = poly.reduce((acc, cur) => [acc[0]+cur[0], acc[1]+cur[1]], [0,0]);
        return [avg[0]/poly.length, avg[1]/poly.length];
      }
      console.log('getDestinationCoords - structure centroid type not handled:', centroid.type);
      return null;
    }
    console.log('getDestinationCoords - no roomId or structureId');
    return null;
  }
}
