import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RecordFormat, RecordCategory } from './record.enum';

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
export class Record extends Document {
  @Prop({ required: true })
  artist: string;

  @Prop({ required: true })
  album: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  qty: number;

  @Prop({ enum: RecordFormat, required: true })
  format: RecordFormat;

  @Prop({ enum: RecordCategory, required: true })
  category: RecordCategory;

  @Prop({ required: false })
  mbid?: string;

  @Prop({
    type: [{ title: String, duration: Number, position: Number }],
    required: false,
  })
  trackList?: { title: string; duration: number }[];

  @Prop({ required: false })
  releaseYear?: number;

  @Prop({ required: false })
  country?: string;

  @Prop({ default: Date.now })
  created: Date;

  @Prop({ default: Date.now })
  lastModified: Date;
}

export const RecordSchema = SchemaFactory.createForClass(Record);

// Add unique index with case-insensitive collation for large datasets
RecordSchema.index(
  { artist: 1, album: 1, format: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

// Add indexes for query performance with large datasets
RecordSchema.index({ artist: 1 });
RecordSchema.index({ album: 1 });
RecordSchema.index({ category: 1 });
RecordSchema.index({ format: 1 });
