import cors from 'cors';
import dotenv from 'dotenv';
import { addDays, isBefore, parse } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import express, { json, Router } from 'express';
import lodash from 'lodash';
import * as zmq from 'zeromq';
import { connect } from 'mongoose';
import { Config } from './interfaces/config';
import { SongRequest } from './interfaces/song-request';
import srMapper from './mapper/sr-mapper';
import objectUtils from './utils/object-utils';

dotenv.config();
const dbHost = process.env.DB_HOST ?? 'localhost';

const sock = new zmq.Push();

const app = express();

app.use(cors());
app.use(json());

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
  const { name } = req.body;
  const errors = [];
  if (name === undefined) {
    errors.push('name is undefined');
  }
  if (errors.length > 0) {
    return res.status(400).send({
      errors: errors,
    });
  }

  const doc = new SongRequest({
    name: name,
    done: false,
  });
  const out = await doc.save();
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
  doc.done = req.body.done;
  try {
    const result = await doc.save();
    return res.status(200).send(srMapper.map(result.toObject()));
  } catch (err) {
    console.error(err);
    return res.status(500).send();
  }
});

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

app.get('/', (_, res) => res.status(200).send({ message: 'server is up!' }));
app.use('/api', configRouter, requestRouter);

connect(`mongodb://srapp:XgKaZ3SE8Ctvc5KF4nqc@${dbHost}/ddsrdb`)
  .then(async () => {
    console.log('connected to mongodb');
    const accepting = await Config.findOne({ name: 'accepting' });
    if (!accepting) {
      const doc = new Config({
        name: 'accepting',
        value: 'false',
      });
      await doc.save();
    }
  })
  .then(() =>
    sock.bind('tcp://127.0.0.1:4200').then(() => {
      console.log('bound to port 4200');
      return app.listen(4000, () => console.log('listening on port 4000'));
    })
  );
