import { Request, Response, NextFunction } from 'express';
import { ApiKey } from '../interfaces/apikeys';

const restrict = (req: Request, resp: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization || authorization.length === 0)
    return resp.status(401).send({ message: 'unauthorized' });
  return ApiKey.findOne({ value: authorization })
    .then((key) => {
      return key != null
        ? next()
        : resp.status(401).send({ message: 'unauthorized' });
    })
    .catch((error) => {
      console.error(error);
      return resp.status(500).send({ message: 'internal server error' });
    });
};

export default restrict;
