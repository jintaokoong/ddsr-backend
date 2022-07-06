import cors from 'cors';
import dotenv from 'dotenv';
import { json } from 'express';
import { connect } from 'mongoose';
import { Config } from './interfaces/config';
import configRouter from './routers/config-router';
import requestRouter from './routers/request-router';
import { app, server } from './servers/servers';

dotenv.config();

const connection = process.env.DB_CONN ?? '';
const port = process.env.PORT ?? 4000;
const password = process.env.DB_PASS ?? '';
const username = process.env.DB_USER ?? '';

app.use(cors());
app.use(json());

app.get('/', (_, res) => res.status(200).send({ message: 'server is up!' }));
app.use('/api', configRouter, requestRouter);

connect(connection, {
  pass: password,
  user: username,
  dbName: 'ddsrdb',
})
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
    server.listen(port, () => console.log(`listening on port ${port}`))
  );
