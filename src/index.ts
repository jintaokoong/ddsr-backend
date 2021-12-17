import express, { json, Router } from 'express';
import { connect } from 'mongoose';
import { SongRequest } from './interfaces/song-request';
import cors from 'cors';
import lodash from 'lodash';
import { format, addDays, isBefore, parse } from 'date-fns';
import srMapper from './mapper/sr-mapper';
import objectUtils from './utils/object-utils';
import { Config } from './interfaces/config';

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
requestRouter.get('/request', async (_, res) => {
  const lastWeek = addDays(new Date(), -7);
  const docs = await SongRequest.find({ createdAt: { $gte: lastWeek }});
  const objs = docs.map((d) => d.toObject());
  const grouped = lodash.groupBy(objs, (o) => {
    return format(o.createdAt, 'yyyy-MM-dd');
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

connect('mongodb://srapp:XgKaZ3SE8Ctvc5KF4nqc@10.144.72.52/ddsrdb')
  .then(async () => {
    const accepting = await Config.findOne({ name: 'accepting' });
    if (!accepting) {
      const doc = new Config({
        name: 'accepting',
        value: 'false',
      });
      await doc.save();
    }
  })
  .then(() => app.listen(4000, () => console.log('listening on port 4000')));
