import request from 'supertest';
import app from '../../src/app.test';

describe('Simple Integration Tests', () => {
  describe('Health Check', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);

      expect(response.body).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request(app)
        .options('/users')
        .set('Origin', 'http://localhost:3001')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('JSON Parsing', () => {
    it('should parse JSON requests correctly', async () => {
      const testData = {
        name: 'Test User',
        email: 'test@example.com'
      };

      // Create a simple middleware test
      app.use('/test-json', (req, res) => {
        res.json({ received: req.body });
      });

      const response = await request(app)
        .post('/test-json')
        .send(testData)
        .expect(200);

      expect(response.body.received).toEqual(testData);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/users')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toBeDefined();
    });
  });
});

