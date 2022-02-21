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

export interface InsertMessage {
  type: 'insert';
  payload: SongRequestResponse;
}

export interface DebugMessage {
  type: 'debug';
}

type Message =
  | HeartbeatMessage
  | RegisterMessage
  | DebugMessage
  | InsertMessage
  | UpdateMessage;

export default Message;
