import request from 'supertest';
import app from '../server.js';

describe('Server REST API Contracts', () => {
  test('GET /api/health returns 200 with service status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'healthy');
    expect(res.body).toHaveProperty('service');
  });

  test('GET /api/unknown-route returns structured 404', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.message).toContain('does not exist');
  });

  test('POST /api/reports without token returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/reports')
      .send({ title: 'Unauthorized Test' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });

  test('GET /api/users without token returns 401 Unauthorized', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
  });
});
