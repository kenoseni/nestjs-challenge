import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OrderSchema } from './schemas/order.schema';
import { RecordModule } from '../record/record.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Order', schema: OrderSchema }]),
    RecordModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
