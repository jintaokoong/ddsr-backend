import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import { CWebSocket } from '../interfaces/websockets/cwebsocket';
import Message from '../interfaces/websockets/message';
import jsonUtils from '../utils/json-utils';

export const app = express();

export const server = http.createServer(app);

export const wss = new WebSocket.WebSocketServer({
  server: server,
});

// event handlers
const onMessage = (ws: CWebSocket) => (msg: WebSocket.RawData) => {
  if (msg === undefined) {
    return;
  }

  // parse json message
  const [error, contents] = jsonUtils.parseJSON<Message>(msg.toString());
  if (error != null || contents == null) {
    console.error('parse-error', 'failed to parse message');
    console.error(msg.toString());
    return;
  }

  // handle message by type
  switch (contents.type) {
    case 'heartbeat':
      ws.isAlive = true;
      return;
    case 'register':
      ws.uuid = contents.payload;
      return;
    case 'debug':
      console.log(
        Array.from(wss.clients).map((c: CWebSocket) => ({
          uuid: c.uuid,
          isAlive: c.isAlive,
        }))
      );
      return;
    default:
      console.log(msg.toString());
  }
};

const onClose = () => {
  clearInterval(interval);
};

// websocket server setups
wss.on('connection', (ws: CWebSocket) => {
  console.log('new client connected');
  ws.isAlive = true;

  ws.on('message', onMessage(ws));
});

const interval = setInterval(function ping() {
  wss.clients.forEach((ws: CWebSocket) => {
    if (ws.isAlive === false) {
      console.log(`terminate ${ws.uuid}`);
      return ws.terminate();
    }

    ws.isAlive = false;
    const message: Message = {
      type: 'heartbeat',
    };
    ws.send(JSON.stringify(message));
  });
}, 5000);

wss.on('close', onClose);
