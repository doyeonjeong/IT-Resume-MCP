import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

const { version } = require('../package.json');

describe('HTTP API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET) returns health metadata', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            name: 'resume-mcp',
            version,
            status: 'ok',
            transport: expect.arrayContaining(['mcp-stdio', 'http']),
            tools: expect.arrayContaining([
              'get_profile',
              'generate_resume',
              'analyze_jd',
              'generate_resume_markdown',
            ]),
          }),
        );
      });
  });

  it('/profile (GET) returns the configured profile shape', () => {
    return request(app.getHttpServer())
      .get('/profile')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            name: expect.any(String),
            title: expect.any(String),
            summary: expect.any(String),
            skills: expect.any(Array),
            projects: expect.any(Array),
          }),
        );
      });
  });
});
