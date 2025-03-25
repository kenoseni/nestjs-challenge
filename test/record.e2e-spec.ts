import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  RecordFormat,
  RecordCategory,
} from '../src/api/record/schemas/record.enum';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../src/api/user/guards/role.guard';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/app.config';

describe('Record (e2e)', () => {
  let app: INestApplication;
  let mongod: MongoMemoryServer;
  let createdRecordId: string;

  const dummyAuthGuard = { canActivate: () => true };
  const dummyRolesGuard = { canActivate: () => true };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: (key: string) => {
          if (key === AppConfig.mongoUrl) {
            return process.env.MONGO_URI;
          }

          return process.env[key];
        },
      })

      .overrideGuard(AuthGuard('jwt'))
      .useValue(dummyAuthGuard)

      .overrideGuard(RolesGuard)
      .useValue(dummyRolesGuard)

      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();

    if (mongod) {
      await mongod.stop();
    }
  });

  describe('POST /records', () => {
    it('should create a new record successfully', async () => {
      const createRecordDto = {
        album: 'Test Album',
        artist: 'Test Artist',
        price: 10,
        qty: 5,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: '',
      };

      const res = await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(201);

      expect(res.body).toHaveProperty('responseCode', 1);
      expect(res.body.data).toMatchObject(createRecordDto);
      createdRecordId = res.body.data.id;
    });

    it('should return 400 when missing required fields', async () => {
      const createRecordDto = {
        artist: 'Test Artist',
        price: 10,
        qty: 5,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: '',
      };

      await request(app.getHttpServer())
        .post('/records')
        .send(createRecordDto)
        .expect(400);
    });
  });

  describe('PUT /records/:id', () => {
    it('should update an existing record successfully', async () => {
      const updateRecordDto = {
        album: 'Updated Album',
        artist: 'Test Artist',
        price: 15,
        qty: 3,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: '',
      };

      const res = await request(app.getHttpServer())
        .put(`/records/${createdRecordId}`)
        .send(updateRecordDto)
        .expect(200);

      expect(res.body).toHaveProperty('responseCode', 1);
      expect(res.body.data).toHaveProperty('album', 'Updated Album');
    });

    it('should return 404 when updating a non-existing record', async () => {
      const updateRecordDto = {
        album: 'Updated Album',
        artist: 'Test Artist',
        price: 15,
        qty: 3,
        format: RecordFormat.VINYL,
        category: RecordCategory.ROCK,
        mbid: '',
      };

      await request(app.getHttpServer())
        .put(`/records/67e217e846f7bfec59575ea4`)
        .send(updateRecordDto)
        .expect(404);
    });
  });

  describe('GET /records', () => {
    it('should fetch records with filters and pagination', async () => {
      const query = {
        q: 'Test',
        artist: 'Test Artist',
      };
      const pagination = { skip: 0, limit: 10 };

      const res = await request(app.getHttpServer())
        .get('/records')
        .query({ ...query, ...pagination })
        .expect(200);

      expect(res.body).toHaveProperty('responseCode', 1);
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('should return empty result when no record matches the filter', async () => {
      const query = { artist: 'Nonexistent Artist' };
      const pagination = { skip: 0, limit: 10 };

      const res = await request(app.getHttpServer())
        .get('/records')
        .query({ ...query, ...pagination })
        .expect(200);

      expect(res.body).toHaveProperty('responseCode', 1);
      expect(res.body.data.items).toHaveLength(0);
    });
  });
});
