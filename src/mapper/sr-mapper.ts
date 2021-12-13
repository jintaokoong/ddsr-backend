import { ISongRequest } from '../interfaces/song-request';

const map = (input: ISongRequest) => ({
  ...input,
  __v: undefined,
  createdAt: input.createdAt.getTime(),
  updatedAt: input.updatedAt.getTime(),
});

export default {
  map,
};
