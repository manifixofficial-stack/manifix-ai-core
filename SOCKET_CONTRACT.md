# Socket.io Event Contract

This frontend was built against an assumed set of events, since it wasn't wired
directly to your `backend/server.js`. Match these event names/payloads on your
server and everything connects with no frontend changes needed.

## Client → Server (frontend emits these)

| Event | Payload | When |
|---|---|---|
| `join-room` | `{ room: "1234" }` | User submits a room code |
| `request-characters` | `{}` | Character select screen mounts |
| `select-character` | `{ character: "OGGY" }` | User taps a character (tentative pick) |
| `join-game` | `{ character: "OGGY", name: "Alex" }` | User taps "Lock in" |
| `move` | `{ x: -1..1, y: -1..1 }` | ~20x/sec while joystick is held; `{x:0,y:0}` on release |

## Server → Client (frontend listens for these)

| Event | Payload | Purpose |
|---|---|---|
| `room-joined` | `{ room: "1234" }` | Confirms the room join succeeded |
| `room-error` | `{ message: "Room is full" }` | Room join failed |
| `characters-update` | `{ taken: { OGGY: true, JACK: false, OLIVIA: false, BOB: true } }` | Broadcast whenever any player locks in a character, so other clients freeze that button |
| `game-state` | `{ players: {...}, vegetables: [...] }` | Broadcast on every tick / change — see shapes below |
| `high-score-flash` | `{ playerId: "abc123" }` | Sent when a player crosses your defined high-score threshold — triggers the gold screen flash |

### `game-state.players` shape
```js
{
  "<socket.id>": {
    x: 0.42,        // normalized 0-1, NOT pixels — canvas scales it
    y: 0.71,        // normalized 0-1
    character: "OGGY",
    name: "Alex",
    score: 30
  },
  // ...one entry per connected player
}
```

### `game-state.vegetables` shape
```js
[
  { id: "veg-9", x: 0.15, y: 0.60, type: "tomato" },   // "tomato" | "carrot" | "broccoli" | "golden"
  // ...
]
```

**Why normalized 0-1 coordinates instead of pixels:** every player's phone has a
different screen size. If your server tracks positions as pixels, it has to know
each phone's resolution. Normalized coordinates mean the server doesn't care
about screen size at all — the canvas just multiplies by its own width/height
when drawing. If your server currently uses pixel coordinates, divide by your
fixed game-world width/height before broadcasting.

## Movement model

The frontend sends **direction vectors**, not target positions
(`move: {x, y}` where each is -1 to 1, like a joystick tilt amount). The server
is expected to be authoritative: on each tick, nudge that player's stored `x, y`
by `vector * speed * deltaTime`, clamp to 0-1, then include it in the next
`game-state` broadcast. This keeps cheating harder (client never tells the
server "I am now at X,Y") and matches how you'd naturally do collision
detection for vegetables and the steal mechanic server-side.

## Golden vegetable & steal mechanic

Nothing frontend-specific needed — these are server-authoritative:
- Golden vegetable: same `game-state.vegetables` array, just `type: "golden"`.
  Worth 10 points server-side; frontend renders it with a glow automatically.
- Steal mechanic: when your server detects two players' circles overlapping,
  deduct 2 points from the "smacked" player and add to the "smacker" — this is
  purely a `game-state.players[...].score` change, no new event needed.

## If your server uses different event names already

Easiest fix: rename the events in `frontend/src/socket.js` callers to match
yours (search for `socket.on(` and `socket.emit(` across the `components/`
folder), rather than renaming your backend. Send me your `server.js` and I'll
line them up exactly.
