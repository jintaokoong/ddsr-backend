import { model, Schema } from 'mongoose';

export interface ISongRequest {
  name: string;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const songRequestSchema = new Schema(
  {
    name: String,
    done: Boolean,
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

export const SongRequest = model<ISongRequest>('request', songRequestSchema);
