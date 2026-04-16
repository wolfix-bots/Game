import type * as Party from "partykit/server";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChatMsg  { text: string; player: string; ts: number; }
interface RoomState {
  board:    string[];
  turn:     string;
  playerX:  string | null;
  playerO:  string | null;
  winner:   string | null;
  isDraw:   boolean;
  chat:     ChatMsg[];
}

const EMPTY = (): RoomState => ({
  board:   Array(9).fill(""),
  turn:    "X",
  playerX: null,
  playerO: null,
  winner:  null,
  isDraw:  false,
  chat:    [],
});

// ─── Win check ────────────────────────────────────────────────────────────────
const LINES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function winner(board: string[]): string | null {
  for (const [a,b,c] of LINES)
    if (board[a] && board[a]===board[b] && board[a]===board[c]) return board[a];
  return null;
}
function isDraw(board: string[]): boolean {
  return board.every(c => c !== "") && !winner(board);
}

// ─── Server ───────────────────────────────────────────────────────────────────
export default class TicTacToeServer implements Party.Server {
  state: RoomState;

  constructor(readonly room: Party.Room) {
    this.state = EMPTY();
  }

  // Persist + broadcast state to all connections
  broadcast(conn?: Party.Connection) {
    const msg = JSON.stringify({ type: "state", state: this.state });
    this.room.broadcast(msg, conn ? [conn.id] : []);
    // Also send to the triggering connection
    if (conn) conn.send(msg);
  }

  onConnect(conn: Party.Connection) {
    // Send current state immediately on join
    conn.send(JSON.stringify({ type: "state", state: this.state }));
  }

  onMessage(raw: string, conn: Party.Connection) {
    let msg: any;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case "join": {
        // Assign role
        if (!this.state.playerX) {
          this.state.playerX = conn.id;
          conn.send(JSON.stringify({ type: "role", role: "X" }));
        } else if (!this.state.playerO && this.state.playerX !== conn.id) {
          this.state.playerO = conn.id;
          conn.send(JSON.stringify({ type: "role", role: "O" }));
        } else {
          // Spectator or reconnect
          const role = this.state.playerX === conn.id ? "X"
                     : this.state.playerO === conn.id ? "O" : null;
          conn.send(JSON.stringify({ type: "role", role }));
        }
        this.broadcast();
        break;
      }

      case "move": {
        const { index, player } = msg;
        const s = this.state;
        if (s.winner || s.isDraw) break;
        if (s.turn !== player) break;
        if (s.board[index] !== "") break;
        // Validate it's really that player's connection
        const expectedConn = player === "X" ? s.playerX : s.playerO;
        if (conn.id !== expectedConn) break;

        s.board[index] = player;
        const w = winner(s.board);
        const d = !w && isDraw(s.board);
        s.winner  = w;
        s.isDraw  = d;
        s.turn    = player === "X" ? "O" : "X";
        this.broadcast();
        break;
      }

      case "reset": {
        this.state = {
          ...EMPTY(),
          playerX: this.state.playerX,
          playerO: this.state.playerO,
        };
        this.broadcast();
        break;
      }

      case "chat": {
        const { text, player } = msg;
        if (!text?.trim()) break;
        this.state.chat = [
          ...this.state.chat.slice(-49),
          { text: text.trim(), player, ts: Date.now() },
        ];
        this.broadcast();
        break;
      }
    }
  }

  onClose(conn: Party.Connection) {
    if (this.state.playerX === conn.id) this.state.playerX = null;
    if (this.state.playerO === conn.id) this.state.playerO = null;
    this.broadcast();
  }
}
