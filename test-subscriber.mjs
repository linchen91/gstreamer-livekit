import { Room, RoomEvent } from 'livekit-client';

const url = 'ws://127.0.0.1:7880';
const token = process.env.TOKEN;

if (!token) {
  console.error('TOKEN environment variable not set');
  process.exit(1);
}

console.log('Connecting to', url);

const room = new Room();
await room.connect(url, token);

console.log('Connected to room:', room.name);
console.log('Participants:', room.participants.size);

room.on(RoomEvent.ParticipantConnected, (p) => {
  console.log('Participant connected:', p.identity);
});

room.on(RoomEvent.TrackSubscribed, (pub) => {
  console.log('Track subscribed:', pub.kind, pub.trackSid);
});

room.on(RoomEvent.Disconnected, () => {
  console.log('Disconnected');
  process.exit(0);
});

// Wait for tracks
setTimeout(() => {
  console.log('Room participants:', room.participants.size);
  room.participants.forEach((p) => {
    console.log('  -', p.identity, 'tracks:', p.tracks.size);
  });
  process.exit(0);
}, 10000);
