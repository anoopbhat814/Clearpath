import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

describe('Auth endpoints (e2e)', () => {
  let app: INestApplication;
  const auth = { login: jest.fn(), refresh: jest.fn(), logout: jest.fn() };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: auth }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(() => app.close());

  it('validates the login body', async () => {
    await request(app.getHttpServer()).post('/auth/login').send({ email: 'not-an-email', password: 'x' }).expect(400);
  });

  it('delegates a valid login', async () => {
    auth.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ops@clearpath.example', password: 'Correct-Horse-Battery-9' })
      .expect(200);
    expect(res.body.accessToken).toBe('a');
  });

  it('rejects unknown properties', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ops@clearpath.example', password: 'Correct-Horse-Battery-9', admin: true })
      .expect(400);
  });
});
