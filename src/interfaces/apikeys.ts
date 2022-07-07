import { model, Schema } from 'mongoose';

export interface IApiKey {
  name: String;
  value: String;
}

const ApiKeySchema = new Schema({
  name: String,
  value: String,
});

export const ApiKey = model<IApiKey>('apikey', ApiKeySchema);
