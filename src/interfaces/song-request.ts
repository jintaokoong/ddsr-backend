import { model, Schema } from 'mongoose';

export interface ISongRequest {
  name: string;
  done: boolean;
  key: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SongRequestResponse
  extends Omit<ISongRequest, 'createdAt' | 'updatedAt'> {
  createdAt: number;
  updatedAt: number;
}

const songRequestSchema = new Schema(
  {
    name: String,
    done: Boolean,
    key: String,
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

export const SongRequest = model<ISongRequest>('request', songRequestSchema);
