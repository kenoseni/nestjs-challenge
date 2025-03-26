import { Types } from 'mongoose';

export function generateObjectId(): string {
  return new Types.ObjectId().toHexString();
}
