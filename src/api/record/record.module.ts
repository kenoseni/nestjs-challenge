import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { RecordController } from './controllers/record.controller';
import { RecordService } from './services/record.service';
import { RecordSchema } from './schemas/record.schema';
import { MbidService } from '../integrations/mbid/mbid.service';
import { HttpClient } from '../integrations/http.client';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Record', schema: RecordSchema }]),
    HttpModule,
  ],
  controllers: [RecordController],
  providers: [RecordService, MbidService, HttpClient],
  exports: [RecordService, MongooseModule],
})
export class RecordModule {}
