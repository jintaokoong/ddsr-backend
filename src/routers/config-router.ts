import { Router } from 'express';
import { Config } from '../interfaces/config';

const configRouter = Router();

configRouter.get('/config', async (_, res) => {
  const accepting = await Config.findOne({ name: 'accepting' });
  return res.send({
    accepting: accepting?.value,
  });
});
configRouter.post('/config/toggle', async (_, res) => {
  const accepting = await Config.findOne({ name: 'accepting' });
  if (!accepting) {
    const doc = new Config({
      name: 'accepting',
      value: 'false',
    });
    return res.status(200).send();
  }
  accepting.value = accepting.value === 'true' ? 'false' : 'true';
  await accepting.save();
  return res.send({
    accepting: accepting.value,
  });
});

export default configRouter;
