import { Router } from 'express';
import { UnifiedRouteController } from '../controllers/UnifiedRouteController';

export const unifiedRoutes = Router();
const controller = new UnifiedRouteController();

/**
 * 🎯 ENDPOINT PRINCIPAL - Rota Completa (Externa + Interna)
 * 
 * POST /api/routes/complete
 * 
 * Body:
 * {
 *   "start": [-48.944024, -16.292984],  // [longitude, latitude]
 *   "destinationRoomId": 123,
 *   "mode": "walking" | "driving"       // opcional, default: "walking"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "segments": [
 *       {
 *         "type": "external" | "internal" | "transition",
 *         "mode": "walking" | "driving",
 *         "path": [[lng, lat], ...],
 *         "floor": 0,                   // apenas para rotas internas
 *         "distance": 123.45,           // em metros
 *         "description": "..."
 *       }
 *     ],
 *     "totalDistance": 500.5,
 *     "estimatedTime": 7.2,             // em minutos
 *     "summary": {
 *       "externalDistance": 300,
 *       "internalDistance": 200.5,
 *       "floorsTraversed": [0, 1, 2]
 *     },
 *     "structure": {...},
 *     "roomsByFloor": {...}
 *   },
 *   "metadata": {
 *     "mode": "walking",
 *     "segmentCount": 5,
 *     "totalDistanceMeters": 500.5,
 *     "estimatedTimeMinutes": 7.2
 *   }
 * }
 */
unifiedRoutes.post('/complete', (req, res) => controller.getCompleteRoute(req, res));

/**
 * 🏢 Rota Interna apenas (mantém compatibilidade com código antigo)
 * 
 * POST /api/routes/internal
 * 
 * Body:
 * {
 *   "start": [-48.944024, -16.292984],
 *   "structureId": 1,
 *   "floor": 0,
 *   "roomId": 123
 * }
 */
unifiedRoutes.post('/internal', (req, res) => controller.getInternalRoute(req, res));

/**
 * 📋 Obter todas as rotas (debug/visualização)
 * 
 * GET /api/routes/all
 */
unifiedRoutes.get('/all', (req, res) => controller.getAllRoutes(req, res));

/**
 * 🚶🚗 Obter rotas externas por modo
 * 
 * GET /api/routes/external?mode=walking
 * GET /api/routes/external?mode=driving
 */
unifiedRoutes.get('/external', (req, res) => controller.getExternalRoutesByMode(req, res));

/**
 * ✅ Health check
 * 
 * GET /api/routes/health
 */
unifiedRoutes.get('/health', (req, res) => controller.healthCheck(req, res));

// ========================================
// Rotas antigas (manter para compatibilidade)
// ========================================

/**
 * @deprecated Use POST /api/routes/complete em vez disso
 * 
 * POST /api/routes/shortest-to-room
 */
unifiedRoutes.post('/shortest-to-room', (req, res) => {
  console.warn('⚠️ Endpoint /shortest-to-room está deprecated. Use /complete');
  return controller.getCompleteRoute(req, res);
});

export default unifiedRoutes;