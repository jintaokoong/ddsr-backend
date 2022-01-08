import { SongRequestResponse } from '../song-request';

export interface HeartbeatMessage {
  type: 'heartbeat';
}

export interface RegisterMessage {
  type: 'register';
  payload: string;
}

export interface UpdateMessage {
  type: 'update';
  payload: SongRequestResponse;
}

export interface DebugMessage {
  type: 'debug';
}

type Message =
  | HeartbeatMessage
  | RegisterMessage
  | DebugMessage
  | UpdateMessage;

export default Message;
