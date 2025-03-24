import { Module } from '@nestjs/common';
import { RecordModule } from './api/record/record.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfig } from './app.config';
import { OrderModule } from './api/order/order.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import redisStore from 'cache-manager-redis-store';
import {
  DbExceptionsFilter,
  HttpExceptionsFilter,
} from './api/common/exceptions/global.exception.filter';
import { HttpClient } from './api/integrations/http.client';
import { AppService } from './app.service';
import { HttpModule } from '@nestjs/axios';
import * as process from 'process';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from './api/user/user.module';
import { SeederService } from './api/common/helpers/seeders.service';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './api/user/strategy/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => {
        if (!process.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const options = {
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1h' },
        };
        return options;
      },
      global: true,
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 100,
        },
      ],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    CacheModule.register({
      useFactory: () => {
        if (!process.env.REDIS_URL) {
          throw new Error('REDIS_URL is not defined in environment variables');
        }
        return {
          store: redisStore,
          url: process.env.REDIS_URL,
          ttl: parseInt(process.env.REDIS_TTL, 10) || 600,
          isGlobal: true,
        };
      },
      isGlobal: true,
    }),
    MongooseModule.forRoot(AppConfig.mongoUrl),
    RecordModule,
    OrderModule,
    UserModule,
    HttpModule,
  ],
  controllers: [],
  providers: [
    AppService,
    SeederService,
    HttpClient,
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Register first to catch Mongoose/MongoDB errors
    {
      provide: APP_FILTER,
      useClass: DbExceptionsFilter,
    },
    // Register second as the fallback
    {
      provide: APP_FILTER,
      useClass: HttpExceptionsFilter,
    },
  ],
})
export class AppModule {}
