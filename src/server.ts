import './interface/express';
import app from './app';
import 'module-alias/register';
import bonjour from 'bonjour-service';
import { setupUserDistanceSocket } from './websocket/userDistanceSocket';
import http from 'http';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

const server = http.createServer(app);
setupUserDistanceSocket(server);

server.listen(process.env.PORT || 3000, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  try {
    const mdns = new bonjour();
    mdns.publish({
      name: 'unigo-backend',
      type: 'http',
      port: PORT,
      txt: { path: '/', health: '/health' }
    });
    console.log('📡 mDNS service advertised: unigo-backend._http._tcp.local');
  } catch (err) {
    console.error('mDNS advertise failed', err);
  }
});
