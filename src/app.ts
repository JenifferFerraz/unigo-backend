import express from 'express';
import cors from 'cors';  
import { AppDataSource } from './config/data-source';
import { userRoutes } from './routes/user.routes';
import { authRoutes } from './routes//auth.routes';
import { courseRoutes } from './routes/course.routes';
import { locationRoutes } from './routes/location.routes';
import { notificationRoutes } from './routes/notification.routes';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1):[0-9]+$/)) {
      return callback(null, true);
    }
    
    const allowedDomains = [process.env.FRONTEND_URL || 'http://localhost:3001', 'http://127.0.0.1:3001'];
    if (allowedDomains.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());  

app.use('/users', userRoutes);
app.use('/auth', authRoutes); 
app.use('/api', courseRoutes);
app.use('/locations', locationRoutes);
app.use('/notifications', notificationRoutes);

// Health check endpoint for connectivity and discovery validation
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

AppDataSource.initialize()
  .then(() => {
    console.log('📦 Banco conectado com sucesso');
  })
  .catch((err) => {
    console.error('Erro ao conectar com o banco', err);
  });

export default app;