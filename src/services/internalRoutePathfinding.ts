import { InternalRoute } from '../entities/InternalRoute';

export function haversine(a: number[], b: number[]): number {
  const toRad = (deg: number) => deg * Math.PI / 180;
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const aVal = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(aVal));
}

function buildGraph(routes: InternalRoute[]) {
  const graph: Record<string, Record<string, number>> = {};
  for (const route of routes) {
    const lines = route.geometry.coordinates;
    for (const line of lines) {
      for (let i = 0; i < line.length - 1; i++) {
        const a = line[i];
        const b = line[i+1];
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
  return graph;
}

function dijkstra(graph: Record<string, Record<string, number>>, start: string, end: string): string[] {
  const distances: Record<string, number> = {};
  const prev: Record<string, string|null> = {};
  const visited: Set<string> = new Set();
  
  Object.keys(graph).forEach(node => {
    distances[node] = Infinity;
    prev[node] = null;
  });
  
  distances[start] = 0;
  
  while (visited.size < Object.keys(graph).length) {
    let minNode: string|null = null;
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
  let curr: string|null = end;
  while (curr) {
    path.unshift(curr);
    curr = prev[curr];
  }
  
  return path[0] === start ? path : [];
}

/**
 * Finds the nearest node in the graph to a given point
 * @param graph - The graph of route nodes
 * @param point - The target point [lng, lat]
 * @param maxTolerance - Maximum distance in meters to consider (default: 50m)
 * @returns The key of the nearest node or null if none found within tolerance
 */
function findNearestNode(
  graph: Record<string, Record<string, number>>, 
  point: number[], 
  maxTolerance: number = 50
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
    console.warn(`[findNearestNode] Nearest node is ${minDist.toFixed(2)}m away, exceeds tolerance of ${maxTolerance}m`);
    return null;
  }
  
  return nearest;
}

/**
 * Finds the shortest route between start and end points using internal routes
 * @param routes - Array of internal route segments
 * @param start - Starting point [lng, lat]
 * @param end - Ending point [lng, lat]
 * @param tolerance - Maximum distance in meters to snap points to nearest route node (default: 50m)
 * @returns Array of coordinates representing the path, or empty array if no path found
 */
export function findShortestInternalRoute(
  routes: InternalRoute[], 
  start: number[], 
  end: number[],
  tolerance: number = 10000
): number[][] {
  
  const graph = buildGraph(routes);

  
  
  // Check if start/end points are exact  in the graph
  const startKey = Object.prototype.hasOwnProperty.call(graph, start.join(','))
    ? start.join(',')
    : findNearestNode(graph, start, tolerance);
    
  const endKey = Object.prototype.hasOwnProperty.call(graph, end.join(','))
    ? end.join(',')
    : findNearestNode(graph, end, tolerance);

  if (!startKey) {
    return [];
  }
  
  if (!endKey) {
    return [];
  }


  const path = dijkstra(graph, startKey, endKey);

  if (path.length === 0) {
    return [];
  }


  return path.map(p => p.split(',').map(Number));
}