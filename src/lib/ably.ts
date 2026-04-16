import Ably from 'ably';

const ABLY_KEY = import.meta.env.VITE_ABLY_KEY || 'Tut6rg.KFhNxw:ng0ZcT4BNj4ytIUsVOCAuP2JZuMy8hcxvEwv_54b-dk';

export const ably = new Ably.Realtime({ key: ABLY_KEY, clientId: Math.random().toString(36).slice(2) });

export function getRoomChannel(roomId: string) {
  return ably.channels.get(`ttt-room-${roomId}`);
}
