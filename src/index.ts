import cors from 'cors';
import dotenv from 'dotenv';
import express, { json } from 'express';
import { connect } from 'mongoose';
import { Config } from './interfaces/config';
import configRouter from './routers/config-router';
import requestRouter from './routers/request-router';
import zmqSocket from './servers/zmq-socket';

dotenv.config();
const dbHost = process.env.DB_HOST ?? 'localhost';

const app = express();

app.use(cors());
app.use(json());

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
    zmqSocket.bind('tcp://127.0.0.1:4200').then(() => {
      console.log('bound to port 4200');
      return app.listen(4000, () => console.log('listening on port 4000'));
    })
  );
