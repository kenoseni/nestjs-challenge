import { BadRequestException } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';

export const isValidId = (id: string) => {
  if (!isValidObjectId(id)) {
    throw new BadRequestException('Invalid ID format');
  }
};
