import { Module } from '@nestjs/common';
import { RecordModule } from './api/record/record.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfig } from './app.config';
import { OrderModule } from './api/order/order.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET is not defined in environment variables');
        }
        const options = {
          secret: secret,
          signOptions: { expiresIn: '7d' },
        };
        return options;
      },
      global: true,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60,
          limit: 100,
        },
      ],
    }),

    CacheModule.register({
      useFactory: (config: ConfigService) => {
        const redisUrl = config.get<string>('REDIS_URL');
        const ttl = config.get<string>('REDIS_TTL');
        if (!redisUrl) {
          throw new Error('REDIS_URL is not defined in environment variables');
        }
        return {
          store: redisStore,
          url: redisUrl,
          ttl: parseInt(ttl, 10) || 600,
          isGlobal: true,
        };
      },
      isGlobal: true,
      inject: [ConfigService],
    }),

    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        return {
          uri: config.get<string>(AppConfig.mongoUrl),
        };
      },
      inject: [ConfigService],
    }),
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
