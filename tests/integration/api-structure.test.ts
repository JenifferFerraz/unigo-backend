import request from 'supertest';
import app from '../../src/app.test';

describe('API Structure Tests', () => {
  describe('Route Registration', () => {
    it('should have users route registered', async () => {
      const response = await request(app)
        .post('/users')
        .send({})
        .expect(400); // Should return validation error, not 404

      expect(response.body).toHaveProperty('error');
    });

    it('should have auth route registered', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({})
        .expect(401); // Should return auth error, not 404

      expect(response.body).toHaveProperty('message');
    });

    it('should have course routes registered', async () => {
      const response = await request(app)
        .get('/api')
        .expect(500); // Should return service error, not 404

      // This confirms the route exists but service fails (expected in test environment)
    });
  });

  describe('Middleware Stack', () => {
    it('should apply CORS middleware', async () => {
      const response = await request(app)
        .options('/users')
        .set('Origin', 'http://localhost:3001')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    });

    it('should apply JSON parsing middleware', async () => {
      const response = await request(app)
        .post('/users')
        .set('Content-Type', 'application/json')
        .send('{"test": "data"}')
        .expect(400); // Validation error, not parsing error

      expect(response.body).toHaveProperty('error');
    });

    it('should handle large JSON payloads', async () => {
      const largeData = {
        name: 'Test User',
        email: 'test@example.com',
        data: 'x'.repeat(10000) // 10KB of data
      };

      const response = await request(app)
        .post('/users')
        .send(largeData)
        .expect(400); // Should handle large payloads

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Error Responses', () => {
    it('should return proper error format for validation errors', async () => {
      const response = await request(app)
        .post('/users')
        .send({}) // Empty body should trigger validation
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });

    it('should return proper error format for auth errors', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({}) // Empty body should trigger auth error
        .expect(401);

      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });
  });

  describe('Content Type Handling', () => {
    it('should accept application/json', async () => {
      const response = await request(app)
        .post('/users')
        .set('Content-Type', 'application/json')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing content-type', async () => {
      const response = await request(app)
        .post('/users')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});

