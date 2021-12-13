import express, { json, Router } from 'express';
import { connect } from 'mongoose';
import { SongRequest } from './interfaces/song-request';
import cors from 'cors';
import srMapper from './mapper/sr-mapper';

const app = express();

app.use(cors());
app.use(json());

const router = Router();
router.get('/request', async (_, res) => {
  const docs = await SongRequest.find({});
  const projected = docs.map((d) => d.toObject()).map((sr) => srMapper.map(sr));
  return res.send(projected);
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
