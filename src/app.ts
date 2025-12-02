import express from 'express';
import cors from 'cors';  
import { AppDataSource } from './config/data-source';
import { userRoutes } from './routes/user.routes';
import { authRoutes } from './routes//auth.routes';
import { courseRoutes } from './routes/course.routes';
import { roomRouter } from './routes/room.routes';
import { locationRoutes } from './routes/location.routes';
import { notificationRoutes } from './routes/notification.routes';
import { examRoutes } from './routes/exam.routes';
import { structureRoutes } from './routes/structure.routes';
import { unifiedRoutes } from './routes/unified.routes';
import { uploadRoutes } from './routes/upload.routes';
import { scheduleRoutes } from './routes/schedule.routes';
import { eventRoutes } from './routes/event.routes';
import { academicCalendarRoutes } from './routes/academicCalendar.routes';
import feedbackRoutes from './routes/feedback.routes';
import * as PreventSqlHtmlInjection from './middlewares/PreventSqlHtmlInjection';

const app = express();


app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.use(PreventSqlHtmlInjection.preventSqlHtmlInjection);

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
app.use('/exams', examRoutes);
app.use('/structure', structureRoutes);
app.use('/routes', unifiedRoutes);
app.use('/room', roomRouter);
app.use('/upload', uploadRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/events', eventRoutes);
app.use('/api/academic-calendar', academicCalendarRoutes);
app.use('/api/feedback', feedbackRoutes);

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