import { model, Schema } from 'mongoose';

export interface ISongRequest {
  name: string;
  done: boolean;
  key: string;
  details?: {
    title: string;
    url: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const songRequestSchema = new Schema(
  {
    name: String,
    done: Boolean,
    key: String,
    details: {
      title: String,
      url: String,
    },
    __v: { type: Number, select: false },
  },
  {
    timestamps: true,
  }
);

export const SongRequest = model<ISongRequest>('request', songRequestSchema);
