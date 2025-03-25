import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      return ret;
    },
  },
  versionKey: false,
})
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  // e.g., ['creator'], ['customer'], or both
  @Prop({ type: [String], required: true })
  roles: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
