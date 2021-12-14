import express, { json, Router } from 'express';
import { connect } from 'mongoose';
import { SongRequest } from './interfaces/song-request';
import cors from 'cors';
import lodash from 'lodash';
import { format } from 'date-fns';
import srMapper from './mapper/sr-mapper';
import objectUtils from './utils/object-utils';

const app = express();

app.use(cors());
app.use(json());

const router = Router();
router.get('/request', async (_, res) => {
  const docs = await SongRequest.find({});
  const objs = docs.map((d) => d.toObject());
  const grouped = lodash.groupBy(objs, (o) => {
    return format(o.createdAt, 'yyyy-MM-dd');
  });
  const mapped = objectUtils.getKeys(grouped).reduce(
    (pv, cv) => ({
      ...pv,
      [cv]: grouped[cv].map((sr) => srMapper.map(sr)),
    }),
    {}
  );
  return res.send(mapped);
});

router.post('/request', async (req, res) => {
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

router.put('/request/:id', async (req, res) => {
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

app.get('/', (_, res) => res.status(200).send({ message: 'server is up!' }));
app.use('/api', router);

connect('mongodb://srapp:XgKaZ3SE8Ctvc5KF4nqc@10.144.72.52/ddsrdb').then(() =>
  app.listen(4000, () => console.log('listening on port 4000'))
);
