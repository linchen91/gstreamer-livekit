const http = require('http');
const { exec } = require('child_process');

const API_KEY = 'devkey';
const API_SECRET = 'secretsecretsecretsecretsecretsecretsecret';
const SERVER_URL = 'http://127.0.0.1:7880';

async function getToken(room, identity) {
  return new Promise((resolve, reject) => {
    exec(`lk token create --room "${room}" --identity "${identity}" --join --valid-for 1h --url ${SERVER_URL} --api-key ${API_KEY} --api-secret "${API_SECRET}" --token-only`, 
      (err, stdout) => {
        if (err) reject(err);
        else resolve(stdout.trim());
      });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/getToken' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const {room, identity} = JSON.parse(body);
        const token = await getToken(room, identity);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({token}));
      } catch (e) {
        res.writeHead(500, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({error: e.message}));
      }
    });
  } else if (req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`<!DOCTYPE html>
<html>
<head>
  <title>LiveKit SFU Viewer</title>
  <script type="importmap">
  {
    "imports": {
      "livekit-client": "https://cdn.jsdelivr.net/npm/livekit-client/+esm"
    }
  }
  </script>
  <style>
    body { font-family: sans-serif; padding: 20px; }
    video { width: 300px; margin: 10px; background: #000; }
    input, button { padding: 10px; margin: 5px; }
    #videos { display: flex; flex-wrap: wrap; }
  </style>
</head>
<body>
  <h1>LiveKit SFU Viewer</h1>
  <input id="room" value="myroom">
  <input id="name" value="viewer">
  <button id="joinBtn">Join</button>
  <button id="leaveBtn" disabled>Leave</button>
  <div id="videos"></div>
  <script type="module">
    import * as LiveKit from 'livekit-client';
    
    let room;
    
    document.getElementById('joinBtn').addEventListener('click', async () => {
      const roomName = document.getElementById('room').value;
      const userName = document.getElementById('name').value;
      
      const resp = await fetch('/getToken', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({room: roomName, identity: userName})
      });
      const {token} = await resp.json();
      
      room = new LiveKit.Room();
      await room.connect('ws://127.0.0.1:7880', token);
      
      // Listen for track subscriptions
      room.on(LiveKit.RoomEvent.TrackSubscribed, (track, pub, participant) => {
        addVideo(track, participant.identity);
      });
      
      // Also check local participant
      room.localParticipant.tracks?.forEach(pub => {
        if (pub.track) {
          addVideo(pub.track, 'You');
        }
      });
      
      document.getElementById('joinBtn').disabled = true;
      document.getElementById('leaveBtn').disabled = false;
    });
    
    function addVideo(track, identity) {
      const div = document.createElement('div');
      div.innerHTML = '<p>' + identity + '</p>';
      div.appendChild(track.attach());
      document.getElementById('videos').appendChild(div);
    }
    
    document.getElementById('leaveBtn').addEventListener('click', () => {
      room?.disconnect();
      document.getElementById('videos').innerHTML = '';
      document.getElementById('joinBtn').disabled = false;
      document.getElementById('leaveBtn').disabled = true;
    });
  </script>
</body>
</html>`);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3000, () => console.log('SFU Viewer at http://127.0.0.1:3000'));
