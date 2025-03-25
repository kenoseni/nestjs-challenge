import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../src/api/user/guards/role.guard';
import {
  RecordFormat,
  RecordCategory,
} from '../src/api/record/schemas/record.enum';
import { OrderStatus } from 'src/api/order/schemas/order.enum';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/app.config';

describe('Order (e2e)', () => {
  let app: INestApplication;
  let createdRecordId: string;
  let createdOrderId: string;

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

    const uniqueSuffix = Date.now();
    const createRecordDto = {
      album: `Record for Order ${uniqueSuffix}`,
      artist: 'Order Artist',
      price: 20,
      qty: 10,
      format: RecordFormat.VINYL,
      category: RecordCategory.ROCK,
      mbid: '',
    };

    const recordRes = await request(app.getHttpServer())
      .post('/records')
      .send(createRecordDto)
      .expect(201);

    createdRecordId = recordRes.body.data.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /orders', () => {
    it('should create a new order successfully', async () => {
      const createOrderDto = {
        recordId: createdRecordId,
        quantity: 1,
      };

      const res = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      expect(res.body).toHaveProperty('responseCode', 1);
      expect(res.body.data).toHaveProperty('record', createdRecordId);
      createdOrderId = res.body.data.id;
    });

    it('should return 400 for invalid order payload', async () => {
      const createOrderDto = {
        recordId: createdRecordId,
      };

      await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(400);
    });
  });

  describe('GET /orders', () => {
    it('should fetch orders with pagination', async () => {
      const pagination = { skip: 0, limit: 10 };

      const res = await request(app.getHttpServer())
        .get('/orders')
        .query(pagination)
        .expect(200);

      expect(res.body).toHaveProperty('responseCode', 1);
      expect(res.body.data).toHaveProperty('items');
      expect(Array.isArray(res.body.data.items)).toBe(true);
    });
  });

  describe('PATCH /orders/:id/cancel', () => {
    it('should cancel an existing order successfully', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/orders/${createdOrderId}/cancel`)
        .expect(200);

      expect(res.body).toHaveProperty('responseCode', 1);
      expect(res.body.data).toHaveProperty('status', OrderStatus.CANCELLED);
    });

    it('should return 404 when cancelling a non-existing order', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/67e217e846f7bfec59575ea4/cancel`)
        .expect(404);
    });
  });

  describe('PATCH /orders/:id/approve', () => {
    it('should approve an existing pending order successfully', async () => {
      const createOrderDto = {
        recordId: createdRecordId,
        quantity: 1,
      };

      const orderRes = await request(app.getHttpServer())
        .post('/orders')
        .send(createOrderDto)
        .expect(201);

      const pendingOrderId = orderRes.body.data.id;

      const res = await request(app.getHttpServer())
        .patch(`/orders/${pendingOrderId}/approve`)
        .expect(200);

      expect(res.body).toHaveProperty('responseCode', 1);
      expect(res.body.data).toHaveProperty('status', OrderStatus.COMPLETED);
    });

    it('should return 404 when approving a non-existing order', async () => {
      await request(app.getHttpServer())
        .patch(`/orders/67e217e846f7bfec59575ea4/approve`)
        .expect(404);
    });
  });
});
