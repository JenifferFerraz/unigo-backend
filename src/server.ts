import './interface/express';
import app from './app';
import 'module-alias/register';
import bonjour from 'bonjour-service';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
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
