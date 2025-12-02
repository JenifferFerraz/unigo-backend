import { Router } from 'express';
import FeedbackController from '../controllers/FeedbackController';
import TokenNode from '../middlewares/Token';

const router = Router();

/**
 * Rotas públicas (anônimas ou autenticadas)
 */

// Criar feedback (público - com ou sem token)
// Se tiver token, associa ao usuário; se não, cria anônimo
router.post(
  '/',
  async (req, res, next) => {
    // Middleware opcional: tenta autenticar mas não falha se não tiver token
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        await TokenNode.authorize(req, res, () => {});
      } catch (error) {
        // Ignora erro de autenticação e continua como anônimo
      }
    }
    next();
  },
  FeedbackController.create
);

/**
 * Rotas protegidas (apenas admin)
 */

// Listar todos os feedbacks
router.get('/', TokenNode.authorize.bind(TokenNode), TokenNode.isAdmin.bind(TokenNode), FeedbackController.list);

// Obter estatísticas
router.get('/stats', TokenNode.authorize.bind(TokenNode), TokenNode.isAdmin.bind(TokenNode), FeedbackController.getStats);

// Exportar estatísticas para CSV (usando script Python)
router.get('/stats/export/csv', TokenNode.authorize.bind(TokenNode), TokenNode.isAdmin.bind(TokenNode), FeedbackController.exportStatsCsv);

// Exportar feedbacks para CSV
router.get('/export/csv', TokenNode.authorize.bind(TokenNode), TokenNode.isAdmin.bind(TokenNode), FeedbackController.exportCsv);

// Obter feedback por ID
router.get('/:id', TokenNode.authorize.bind(TokenNode), TokenNode.isAdmin.bind(TokenNode), FeedbackController.getById);

// Deletar feedback
router.delete('/:id', TokenNode.authorize.bind(TokenNode), TokenNode.isAdmin.bind(TokenNode), FeedbackController.delete);

export default router;
