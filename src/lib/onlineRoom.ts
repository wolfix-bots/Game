// ─── Generic Online Room via Ably ─────────────────────────────────────────────
// Used by Connect4, Reversi, Battleship, Checkers, Pong etc.

import Ably from 'ably';

const ABLY_KEY = import.meta.env.VITE_ABLY_KEY || 'Tut6rg.KFhNxw:ng0ZcT4BNj4ytIUsVOCAuP2JZuMy8hcxvEwv_54b-dk';

let _client: Ably.Realtime | null = null;
export function getAblyClient(): Ably.Realtime {
  if (!_client) {
    _client = new Ably.Realtime({ key: ABLY_KEY, clientId: Math.random().toString(36).slice(2) });
  }
  return _client;
}

export function genRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export interface RoomPlayer {
  id: string;
  username: string;
  avatar: string;
}

export type RoomMsg<T = any> =
  | { type: 'join';    player: RoomPlayer }
  | { type: 'state';   state: T }
  | { type: 'chat';    text: string; player: string; avatar: string }
  | { type: 'leave';   playerId: string }
  | { type: 'rematch' };

export class OnlineRoom<T> {
  private channel: any;
  private client: Ably.Realtime;
  public roomCode: string;
  public myId: string;

  constructor(roomCode: string) {
    this.client = getAblyClient();
    this.roomCode = roomCode;
    this.myId = this.client.auth.clientId || Math.random().toString(36).slice(2);
    this.channel = this.client.channels.get(`foxytac-${roomCode}`);
  }

  async connect() {
    await this.channel.attach();
  }

  subscribe(cb: (msg: RoomMsg<T>) => void) {
    this.channel.subscribe('msg', (m: any) => {
      try { cb(m.data as RoomMsg<T>); } catch {}
    });
  }

  async publish(msg: RoomMsg<T>) {
    try { await this.channel.publish('msg', msg); } catch {}
  }

  onPresence(cb: (members: any[]) => void) {
    this.channel.presence.subscribe(() => {
      this.channel.presence.get((_: any, members: any[]) => cb(members || []));
    });
    this.channel.presence.enter();
  }

  leave() {
    try { this.channel.presence.leave(); this.channel.detach(); } catch {}
  }
}
