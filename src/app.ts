import express from 'express';
import cors from 'cors';  
import { AppDataSource } from './config/data-source';
import { userRoutes } from './routes/user.routes';
import { authRoutes } from './routes//auth.routes';
import { courseRoutes } from './routes/course.routes';

const app = express();


app.use(cors({
  origin: ['http://localhost:58383', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

app.use('/users', userRoutes);
app.use('/auth', authRoutes); 
app.use('/api', courseRoutes);

AppDataSource.initialize()
  .then(() => {
    console.log('📦 Banco conectado com sucesso');
  })
  .catch((err) => {
    console.error('Erro ao conectar com o banco', err);
  });

export default app;