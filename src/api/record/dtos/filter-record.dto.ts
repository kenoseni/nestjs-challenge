import { IsOptional, IsString, IsEnum } from 'class-validator';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';

export class FindAllQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsString()
  album?: string;

  @IsOptional()
  @IsEnum(RecordFormat)
  format?: RecordFormat;

  @IsOptional()
  @IsEnum(RecordCategory)
  category?: RecordCategory;
}
