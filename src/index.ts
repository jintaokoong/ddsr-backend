import cors from 'cors';
import dotenv from 'dotenv';
import { json } from 'express';
import { connect } from 'mongoose';
import { Config } from './interfaces/config';
import configRouter from './routers/config-router';
import requestRouter from './routers/request-router';
import zmqSocket from './servers/zmq-socket';
import { app, server } from './servers/servers';

dotenv.config();
const dbHost = process.env.DB_HOST ?? 'localhost';
const port = process.env.PORT ?? 4000;

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
      return server.listen(port, () =>
        console.log(`listening on port ${port}`)
      );
    })
  );
