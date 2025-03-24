import { IsMongoId, IsNumber, Min } from 'class-validator';

export class CreateOrderRequestDTO {
  @IsMongoId()
  recordId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}
