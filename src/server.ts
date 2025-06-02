import app from './app';
import 'module-alias/register';

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
