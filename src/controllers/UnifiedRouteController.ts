import { Request, Response } from 'express';
import { UnifiedRouteService, RouteMode } from '../services/UnifiedRouteService';
import { AppDataSource } from '../config/data-source';
import { InternalRoute } from '../entities/InternalRoute';
import { ExternalRoute } from '../entities/ExternalRoute';

export class UnifiedRouteController {
  private unifiedService = new UnifiedRouteService();
  private internalRouteRepo = AppDataSource.getRepository(InternalRoute);
  private externalRouteRepo = AppDataSource.getRepository(ExternalRoute);

  /**
   * Endpoint principal: Calcula rota completa (externa + interna)
   * 
   * Body:
   * {
   *   "start": [-48.944, -16.293],
   *   "destinationRoomId": 123,
   *   "mode": "walking" | "driving"  // opcional, default: "walking"
   * }
   */
 async getCompleteRoute(req: Request, res: Response) {
    try {
      console.log('\n📍 [API] getCompleteRoute chamado');
      console.log('Body:', req.body);

      const { start, destinationRoomId, mode } = req.body;

      // Validação do destinationRoomId
      if (!destinationRoomId || isNaN(Number(destinationRoomId))) {
        return res.status(400).json({
          error: 'Campo "destinationRoomId" inválido ou ausente'
        });
      }

      // ✨ NOVO: Se não houver ponto de partida, retorna apenas informações da estrutura
      if (!start || !Array.isArray(start) || start.length !== 2) {
        console.log('⚠️ Nenhum ponto de partida fornecido - retornando apenas estrutura');
        
        const structureInfo = await this.unifiedService.getStructureInfo(Number(destinationRoomId));
        
        if (!structureInfo) {
          return res.status(404).json({
            error: 'Sala não encontrada'
          });
        }

        return res.json({
          success: true,
          mode: 'structure_only',
          data: {
            structure: structureInfo.structure,
            roomsByFloor: structureInfo.roomsByFloor,
            destinationRoom: structureInfo.destinationRoom,
            floors: structureInfo.floors
          },
          message: 'Nenhuma rota calculada. Estrutura e salas retornadas para visualização.'
        });
      }

      // Validação do ponto de partida
      const routeMode: RouteMode = mode === 'driving' ? 'driving' : 'walking';
      
      const normalizedStart = start.map(Number);

      // Calcular rota completa
      const result = await this.unifiedService.calculateCompleteRoute(
        normalizedStart,
        Number(destinationRoomId),
        routeMode
      );

      if (!result) {
        return res.status(404).json({
          error: 'Não foi possível calcular a rota. Verifique se a sala existe e se há rotas disponíveis.'
        });
      }

      console.log('✅ [API] Rota calculada com sucesso');

      return res.json({
        success: true,
        data: result,
        metadata: {
          mode: routeMode,
          segmentCount: result.segments.length,
          totalDistanceMeters: result.totalDistance,
          estimatedTimeMinutes: result.estimatedTime
        }
      });

    } catch (error: any) {
      console.error('❌ [API] Erro em getCompleteRoute:', error);
      return res.status(500).json({
        error: 'Erro ao calcular rota',
        details: error.message
      });
    }
  }
  /**
   * Endpoint alternativo: Calcula apenas rota interna (mantém compatibilidade)
   * 
   * Body:
   * {
   *   "start": [-48.944, -16.293],
   *   "structureId": 1,
   *   "floor": 0,
   *   "roomId": 123  // opcional
   * }
   */
  async getInternalRoute(req: Request, res: Response) {
    try {
      console.log('\n🏢 [API] getInternalRoute chamado');
      console.log('Body:', req.body);

      const { start, structureId, floor, roomId } = req.body;

      if (!start || !structureId || floor === undefined) {
        return res.status(400).json({
          error: 'Campos obrigatórios: start, structureId, floor'
        });
      }

      const startArr = Array.isArray(start)
        ? start.map(Number)
        : String(start).split(',').map(Number);

      // Usar o serviço unificado internamente
      // Se roomId foi fornecido, usa ele. Caso contrário, usa coordenadas da estrutura
      let result;
      
      if (roomId) {
        result = await this.unifiedService.calculateCompleteRoute(
          startArr,
          Number(roomId),
          'walking'
        );
      } else {
        // Sem roomId, retorna erro ou implementa lógica para estrutura
        return res.status(400).json({
          error: 'roomId é necessário para calcular rota interna'
        });
      }

      if (!result) {
        return res.status(404).json({
          error: 'Não foi possível calcular a rota interna'
        });
      }

      // Filtrar apenas segmentos internos para compatibilidade
      const internalSegments = result.segments.filter(
        s => s.type === 'internal' || s.type === 'transition'
      );

      console.log('✅ [API] Rota interna calculada');

      return res.json({
        success: true,
        segments: internalSegments,
        structure: result.structure,
        roomsByFloor: result.roomsByFloor,
        summary: {
          totalDistance: result.summary.internalDistance,
          floorsTraversed: result.summary.floorsTraversed
        }
      });

    } catch (error: any) {
      console.error('❌ [API] Erro em getInternalRoute:', error);
      return res.status(500).json({
        error: 'Erro ao calcular rota interna',
        details: error.message
      });
    }
  }

  /**
   * Endpoint para obter todas as rotas (internas + externas)
   * Útil para debug e visualização no mapa
   */
  async getAllRoutes(req: Request, res: Response) {
    try {
      const internalRoutes = await this.internalRouteRepo.find({
        relations: ['structure']
      });

      const externalRoutes = await this.externalRouteRepo.find();

      return res.json({
        success: true,
        data: {
          internal: internalRoutes,
          external: externalRoutes
        },
        counts: {
          internal: internalRoutes.length,
          external: externalRoutes.length,
          total: internalRoutes.length + externalRoutes.length
        }
      });

    } catch (error: any) {
      console.error('❌ [API] Erro em getAllRoutes:', error);
      return res.status(500).json({
        error: 'Erro ao buscar rotas',
        details: error.message
      });
    }
  }

  /**
   * Endpoint para obter rotas externas por modo (walking/driving)
   */
  async getExternalRoutesByMode(req: Request, res: Response) {
    try {
      const { mode } = req.query;

      if (!mode || (mode !== 'walking' && mode !== 'driving')) {
        return res.status(400).json({
          error: 'Parâmetro "mode" inválido. Use "walking" ou "driving"'
        });
      }

      const allRoutes = await this.externalRouteRepo.find();
      
      const filteredRoutes = allRoutes.filter(route => {
        if (!route.properties?.mode) {
          return mode === 'walking'; // Default: a pé
        }
        return route.properties.mode === mode;
      });

      return res.json({
        success: true,
        mode,
        count: filteredRoutes.length,
        routes: filteredRoutes
      });

    } catch (error: any) {
      console.error('❌ [API] Erro em getExternalRoutesByMode:', error);
      return res.status(500).json({
        error: 'Erro ao buscar rotas externas',
        details: error.message
      });
    }
  }

  /**
   * Endpoint de saúde para verificar se o serviço está funcionando
   */
  async healthCheck(req: Request, res: Response) {
    try {
      const internalCount = await this.internalRouteRepo.count();
      const externalCount = await this.externalRouteRepo.count();

      return res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        routes: {
          internal: internalCount,
          external: externalCount
        }
      });

    } catch (error: any) {
      return res.status(500).json({
        status: 'unhealthy',
        error: error.message
      });
    }
  }
}