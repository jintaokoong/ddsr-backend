import { addDays, isBefore, parse } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { Router } from 'express';
import lodash from 'lodash';
import { Config } from '../interfaces/config';
import { SongRequest } from '../interfaces/song-request';
import Message from '../interfaces/websockets/message';
import srMapper from '../mapper/sr-mapper';
import { wss } from '../servers/servers';
import zmqSocket from '../servers/zmq-socket';
import memoryStorage from '../utils/memory-storage';
import objectUtils from '../utils/object-utils';

const requestRouter = Router();

requestRouter.use(async (req, res, next) => {
  if (req.method !== 'POST') {
    return next();
  }
  const accepting = await Config.findOne({ name: 'accepting' });
  if (accepting && accepting.value === 'true') {
    return next();
  }
  return res.status(400).send({ message: 'currently not accpeting' });
});

requestRouter.delete('/request/:id', async (req, res) => {
  if (!req.params.id) {
    return res.status(404).send();
  }
  const doc = await SongRequest.findOne({ _id: req.params.id });
  if (!doc) {
    return res.status(404).send();
  }

  try {
    await doc.remove();
    return res.status(200).send();
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
});

requestRouter.get('/request', async (_, res) => {
  const lastWeek = addDays(new Date(), -7);
  const docs = await SongRequest.find({ createdAt: { $gte: lastWeek } });
  const objs = docs.map((d) => d.toObject());
  const grouped = lodash.groupBy(objs, (o) => {
    const time = utcToZonedTime(o.createdAt, 'Asia/Kuala_Lumpur');
    return format(time, 'yyyy-MM-dd');
  });
  const mapped = objectUtils
    .getKeys(grouped)
    .sort((a, b) => {
      const f = parse(a as string, 'yyyy-MM-dd', new Date());
      const s = parse(b as string, 'yyyy-MM-dd', new Date());
      return isBefore(f, s) ? 1 : -1;
    })
    .reduce(
      (pv, cv) => ({
        ...pv,
        [cv]: grouped[cv].map((sr) => srMapper.map(sr)),
      }),
      {}
    );
  return res.send(mapped);
});

requestRouter.post('/request', async (req, res) => {
  const { name, bot } = req.body;
  const errors = [];
  if (name === undefined) {
    errors.push('name is undefined');
  }
  if (errors.length > 0) {
    return res.status(400).send({
      errors: errors,
    });
  }

  const time = utcToZonedTime(new Date(), 'Asia/Kuala_Lumpur');
  const key = format(time, 'yyyy-MM-dd');
  const doc = new SongRequest({
    name: name,
    done: false,
    key: key,
  });
  const out = await doc.save();
  if (bot) {
    const message: Message = {
      type: 'insert',
      payload: srMapper.map(doc.toObject()),
    };
    wss.clients.forEach((ws) => ws.send(JSON.stringify(message)));
  }
  memoryStorage.append(`${out._id}`);
  const payload = [out._id, name];
  zmqSocket.send(payload.join(','));
  return res.send(srMapper.map(out.toObject()));
});

requestRouter.put('/request/:id', async (req, res) => {
  let doc;
  try {
    doc = await SongRequest.findById(req.params.id);
  } catch (err) {
    return res.status(404).send();
  }
  if (!doc) {
    return res.status(404).send();
  }

  if (req.body.done !== undefined) {
    doc.done = req.body.done;
  }

  if (req.body.details !== undefined) {
    doc.details = req.body.details;
  }

  try {
    const result = await doc.save();

    const success = memoryStorage.remove(req.params.id);
    if (success) {
      const payload: Message = {
        type: 'update',
        payload: srMapper.map(doc.toObject()),
      };
      wss.clients.forEach((ws) => ws.send(JSON.stringify(payload)));
    }

    return res.status(200).send(srMapper.map(result.toObject()));
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
});

export default requestRouter;
