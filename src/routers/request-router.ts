import { addDays } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { Router } from 'express';
import lodash from 'lodash';
import { Config } from '../interfaces/config';
import { SongRequest, SongRequestResponse } from '../interfaces/song-request';
import Message from '../interfaces/websockets/message';
import srMapper from '../mapper/sr-mapper';
import restrict from '../middlewares/restrict';
import { wss } from '../servers/servers';

const requestRouter = Router();

const preferredTZ = 'Asia/Taipei';

requestRouter.use(async (req, res, next) => {
  if (req.method !== 'POST') {
    return next();
  }
  const accepting = await Config.findOne({ name: 'accepting' });
  if (accepting && accepting.value === 'true') {
    return next();
  }
  return res.status(400).send({ message: 'currently not accepting' });
});

requestRouter.delete('/request/:id', restrict, async (req, res) => {
  return SongRequest.findOneAndRemove({ _id: req.params.id })
    .then(() => res.status(200).send())
    .catch(() => res.status(500).send({ message: 'internal server error' }));
});

interface DailyGrouping {
  key: string;
  data: SongRequestResponse[];
}

requestRouter.get('/request', async (_, res) => {
  const lastWeek = addDays(new Date(), -7);
  const docs = await SongRequest.find(
    { createdAt: { $gte: lastWeek } },
    undefined,
    { sort: { createdAt: -1 } }
  );
  const regularObjs: SongRequestResponse[] = docs.map((d) =>
    srMapper.map(d.toObject())
  );
  const grouped = lodash.groupBy(regularObjs, (o) => o.key);
  const response: DailyGrouping[] = lodash.map(
    lodash.entries(grouped),
    ([date, requests]): DailyGrouping => ({
      key: date,
      data: lodash.sortBy(requests, (r) => r.createdAt),
    })
  );
  return res.send(response);
});

requestRouter.post('/request', restrict, async (req, res) => {
  const { name, bot } = req.body;

  // validations
  const errors = [];
  if (name === undefined || name.length === 0) {
    errors.push('name is required');
  }
  if (errors.length > 0) {
    return res.status(400).send({
      errors: errors,
    });
  }

  // configure group key
  const time = utcToZonedTime(new Date(), preferredTZ);
  const key = format(time, 'yyyy-MM-dd');

  // create record
  return SongRequest.create({ name, done: false, key }).then((doc) => {
    const returnObj = srMapper.map(doc.toObject());
    if (!bot) return res.send(returnObj);

    // inform connected clients
    const message: Message = {
      type: 'insert',
      payload: returnObj,
    };
    wss.clients.forEach((ws) => ws.send(JSON.stringify(message)));
    return res.send(returnObj);
  });
});

requestRouter.put('/request/:id', restrict, async (req, res) => {
  if (req.body.done === undefined)
    return res.status(400).send({ message: 'missing body' });
  return SongRequest.findByIdAndUpdate(
    req.params.id,
    { done: req.body.done },
    { returnDocument: 'after' }
  )
    .then((doc) => {
      if (!doc) return res.status(404).send();
      return res.send(srMapper.map(doc.toObject()));
    })
    .catch((error) => {
      console.log(error);
      return res.status(500).send({ message: 'internal server error' });
    });
});

export default requestRouter;
