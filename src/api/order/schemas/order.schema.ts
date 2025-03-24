import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Record } from 'src/api/record/schemas/record.schema';
import { OrderStatus } from './order.enum';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Record', required: true })
  record: Record;

  @Prop({ required: true })
  quantity: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ quantity: 1, status: 1 });

OrderSchema.index({ quantity: 1 });
OrderSchema.index({ status: 1 });
