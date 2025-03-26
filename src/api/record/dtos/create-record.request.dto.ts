import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsInt,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecordFormat, RecordCategory } from '../schemas/record.enum';
import { Type, Transform } from 'class-transformer';

export class CreateRecordRequestDTO {
  @ApiProperty({
    description: 'Artist of the record',
    type: String,
    example: 'The Beatles',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  artist: string;

  @ApiProperty({
    description: 'Album name',
    type: String,
    example: 'Abbey Road',
  })
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  album: string;

  @ApiProperty({
    description: 'Price of the record',
    type: Number,
    example: 30,
  })
  @IsNumber()
  @Min(0)
  @Max(10000)
  price: number;

  @ApiProperty({
    description: 'Quantity of the record in stock',
    type: Number,
    example: 1000,
  })
  @IsInt()
  @Min(0)
  @Max(100)
  qty: number;

  @ApiProperty({
    description: 'Format of the record (Vinyl, CD, etc.)',
    enum: RecordFormat,
    example: RecordFormat.VINYL,
  })
  @IsEnum(RecordFormat)
  @IsNotEmpty()
  format: RecordFormat;

  @ApiProperty({
    description: 'Category or genre of the record (e.g., Rock, Jazz)',
    enum: RecordCategory,
    example: RecordCategory.ROCK,
  })
  @IsEnum(RecordCategory)
  @IsNotEmpty()
  category: RecordCategory;

  @ApiProperty({
    description: 'MusicBrainz identifier',
    type: String,
    example: 'b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d',
  })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  mbid?: string;

  @ApiProperty({
    description: 'MusicBrainz track list',
    type: () => [TrackItemDTO],
    required: false,
    example: [
      { position: 1, title: 'Many men', duration: 212333 },
      { position: 2, title: '21 Questions', duration: 289226 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackItemDTO)
  trackList?: TrackItemDTO[];

  @ApiProperty({
    description: 'Year of release',
    type: Number,
    example: 1969,
  })
  @IsNumber()
  @IsOptional()
  releaseYear?: number;

  @ApiProperty({
    description: 'Country',
    type: String,
    example: 'GB',
  })
  @IsString()
  @IsOptional()
  country?: string;
}

class TrackItemDTO {
  @ApiProperty({
    description: 'The position of the track in the release',
    type: Number,
    example: 1,
  })
  position: number;

  @ApiProperty({
    description: 'The title of the track',
    type: String,
    example: 'Get Rich or Die Trying',
  })
  title: string;

  @ApiProperty({
    description: 'The duration of the track in milliseconds',
    type: Number,
    example: 212333,
  })
  duration: number;
}
