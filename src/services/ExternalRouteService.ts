import { AppDataSource } from '../config/data-source';
import { ExternalRoute } from '../entities/ExternalRoute';
import { haversine } from './internalRoutePathfinding';

export class ExternalRouteService {
  private routeRepo = AppDataSource.getRepository(ExternalRoute);

  async getAll() {
    return this.routeRepo.find();
  }
  /**
   * Calcula o caminho externo mais curto entre dois pontos usando as rotas externas
   */
  async calculateExternalPath(start: number[], end: number[], tolerance: number = 100): Promise<number[][]> {
    const routes = await this.getAll();
    return findShortestExternalRoute(routes, start, end, tolerance);
  }

  /**
   * Encontra o ponto mais próximo em todas as rotas externas
   */
  async findNearestExternalPoint(userPosition: number[]): Promise<{
    route: ExternalRoute;
    nearestPoint: number[];
    distance: number;
    routeIndex: number;
    pointIndex: number;
  } | null> {
    const routes = await this.getAll();

    if (!routes.length) {
      console.log('[ExternalRouteService] Nenhuma rota externa encontrada');
      return null;
    }

    let globalMinDistance = Infinity;
    let nearestRoute: ExternalRoute | null = null;
    let nearestPoint: number[] | null = null;
    let nearestRouteIndex = -1;
    let nearestPointIndex = -1;

    console.log(`[ExternalRouteService] Buscando ponto mais próximo de [${userPosition}] em ${routes.length} rotas externas`);

    for (const route of routes) {
      if (!route.geometry?.coordinates) continue;

      const lines = route.geometry.coordinates;

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];

        for (let pointIdx = 0; pointIdx < line.length; pointIdx++) {
          const point = line[pointIdx];
          const distance = haversine(userPosition, point);

          if (distance < globalMinDistance) {
            globalMinDistance = distance;
            nearestRoute = route;
            nearestPoint = point;
            nearestRouteIndex = lineIdx;
            nearestPointIndex = pointIdx;
          }
        }
      }
    }

    if (!nearestRoute || !nearestPoint) {
      console.log('[ExternalRouteService] Nenhum ponto próximo encontrado');
      return null;
    }

    console.log(`[ExternalRouteService] Ponto mais próximo encontrado: [${nearestPoint}] a ${globalMinDistance.toFixed(2)}m de distância`);

    return {
      route: nearestRoute,
      nearestPoint,
      distance: globalMinDistance,
      routeIndex: nearestRouteIndex,
      pointIndex: nearestPointIndex
    };
  }

  /**
   * Encontra pontos de entrada/saída de estruturas (marcados com isDoor=true)
   */
  async findNearestDoorPoint(userPosition: number[]): Promise<{
    route: ExternalRoute;
    doorPoint: number[];
    distance: number;
  } | null> {
    const routes = await this.getAll();

    let minDistance = Infinity;
    let nearestDoorRoute: ExternalRoute | null = null;
    let nearestDoorPoint: number[] | null = null;

    for (const route of routes) {
      if (!route.properties?.isDoor) continue;
      if (!route.geometry?.coordinates) continue;

      const lines = route.geometry.coordinates;

      for (const line of lines) {
        for (const point of line) {
          const distance = haversine(userPosition, point);

          if (distance < minDistance) {
            minDistance = distance;
            nearestDoorRoute = route;
            nearestDoorPoint = point;
          }
        }
      }
    }

    if (!nearestDoorRoute || !nearestDoorPoint) {
      return null;
    }

    return {
      route: nearestDoorRoute,
      doorPoint: nearestDoorPoint,
      distance: minDistance
    };
  }

  /**
   * Extrai todos os pontos únicos de todas as rotas externas
   */
  async getAllExternalPoints(): Promise<number[][]> {
    const routes = await this.getAll();
    const pointsSet = new Set<string>();

    for (const route of routes) {
      if (!route.geometry?.coordinates) continue;

      const lines = route.geometry.coordinates;
      for (const line of lines) {
        for (const point of line) {
          pointsSet.add(point.join(','));
        }
      }
    }

    return Array.from(pointsSet).map(p => p.split(',').map(Number));
  }

}

function buildExternalGraph(routes: ExternalRoute[]) {
  const graph: Record<string, Record<string, number>> = {};
  for (const route of routes) {
    if (!route.geometry?.coordinates) continue;
    const lines = route.geometry.coordinates;
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const a = line[i];
        const b = line[i + 1];
        const aKey = a.join(',');
        const bKey = b.join(',');
        const dist = haversine(a, b);
        if (!graph[aKey]) graph[aKey] = {};
        if (!graph[bKey]) graph[bKey] = {};
        graph[aKey][bKey] = dist;
        graph[bKey][aKey] = dist;
      }
    }
  }
  const allPoints = Object.keys(graph);
  const INTERSECTION_THRESHOLD = 5;
  for (let i = 0; i < allPoints.length; i++) {
    for (let j = i + 1; j < allPoints.length; j++) {
      const pointA = allPoints[i].split(',').map(Number);
      const pointB = allPoints[j].split(',').map(Number);
      const distance = haversine(pointA, pointB);
      if (distance < INTERSECTION_THRESHOLD) {
        graph[allPoints[i]][allPoints[j]] = distance;
        graph[allPoints[j]][allPoints[i]] = distance;
      }
    }
  }
  return graph;
}

function dijkstra(
  graph: Record<string, Record<string, number>>,
  start: string,
  end: string
): string[] {
  const distances: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited: Set<string> = new Set();
  Object.keys(graph).forEach(node => {
    distances[node] = Infinity;
    prev[node] = null;
  });
  distances[start] = 0;
  while (visited.size < Object.keys(graph).length) {
    let minNode: string | null = null;
    let minDist = Infinity;
    for (const node in distances) {
      if (!visited.has(node) && distances[node] < minDist) {
        minDist = distances[node];
        minNode = node;
      }
    }
    if (minNode === null) break;
    visited.add(minNode);
    if (minNode === end) break;
    for (const neighbor in graph[minNode]) {
      const alt = distances[minNode] + graph[minNode][neighbor];
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        prev[neighbor] = minNode;
      }
    }
  }
  const path: string[] = [];
  let curr: string | null = end;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr];
  }
  return path[0] === start ? path : [];
}

function findNearestGraphNode(
  graph: Record<string, Record<string, number>>,
  point: number[],
  maxTolerance: number = 100
): string | null {
  let minDist = Infinity;
  let nearest: string | null = null;
  for (const nodeKey of Object.keys(graph)) {
    const nodeCoords = nodeKey.split(',').map(Number);
    const dist = haversine(point, nodeCoords);
    if (dist < minDist) {
      minDist = dist;
      nearest = nodeKey;
    }
  }
  if (minDist > maxTolerance) {
    console.warn(`[findNearestGraphNode] Nó mais próximo está a ${minDist.toFixed(2)}m, excede tolerância de ${maxTolerance}m`);
    return null;
  }
  return nearest;
}

export function findShortestExternalRoute(
  routes: ExternalRoute[],
  start: number[],
  end: number[],
  tolerance: number = 10000
): number[][] {
  const graph = buildExternalGraph(routes);
  const startKey = findNearestGraphNode(graph, start, tolerance);
  const endKey = findNearestGraphNode(graph, end, tolerance);
  if (!startKey) {
    console.error(`[findShortestExternalRoute] Não foi possível encontrar ponto inicial próximo às rotas`);
    return [];
  }
  if (!endKey) {
    console.error(`[findShortestExternalRoute] Não foi possível encontrar ponto final próximo às rotas`);
    return [];
  }
  console.log(`[findShortestExternalRoute] Ponto inicial: ${startKey}, Ponto final: ${endKey}`);
  const path = dijkstra(graph, startKey, endKey);
  if (path.length === 0) {
    console.error(`[findShortestExternalRoute] Nenhum caminho encontrado`);
    return [];
  }
  const coordinates = path.map(p => p.split(',').map(Number));
  const startCoords = startKey.split(',').map(Number);
  const endCoords = endKey.split(',').map(Number);
  const result: number[][] = [];
  if (haversine(start, startCoords) > 10000) {
    result.push(start);
  }
  result.push(...coordinates);
  if (haversine(end, endCoords) > 10000) {
    result.push(end);
  }
  return result;
}
