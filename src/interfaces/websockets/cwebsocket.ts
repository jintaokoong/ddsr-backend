import WebSocket from 'ws';

export interface CWebSocket extends WebSocket.WebSocket {
  uuid?: string;
  isAlive?: boolean;
}
