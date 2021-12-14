import { model, Schema } from 'mongoose';

export interface IConfig {
  name: String;
  value: String;
}

const configSchema = new Schema(
  {
    name: String,
    value: String,
  },
  { timestamps: { updatedAt: true } }
);

export const Config = model<IConfig>('config', configSchema);
