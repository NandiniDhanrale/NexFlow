import request from 'supertest';
import app from '../src/index';

describe('Auth API', () => {
  it('should reject registration without email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('should reject registration with short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('should register a new user', async () => {
    const email = `test-${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123', name: 'Test User' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe(email);
  });

  it('should login with valid credentials', async () => {
    const email = `login-${Date.now()}@test.com`;
    await request(app)
      .post('/api/auth/register')
      .send({ email, password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });
});
