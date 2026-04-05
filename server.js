const fs = require('fs');
const http = require('http');
const { AccessToken } = require('livekit-server-sdk');

const API_KEY = 'devkey';
const API_SECRET = 'secretsecretsecretsecretsecretsecretsecret';
const SERVER_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
const BROWSER_WS_URL = process.env.BROWSER_WS_URL || 'ws://localhost:7880';

function getToken(room, identity) {
  const token = new AccessToken(API_KEY, API_SECRET, {
    identity,
    name: identity,
  });

  token.addGrant({
    roomJoin: true,
    room: room,
    canPublish: true,
    canSubscribe: true,
  });

  return token.toJwt();
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
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <script src="https://unpkg.com/livekit-client@1.3.3/dist/livekit-client.umd.js"></script>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #222; color: #fff; }
    video { width: 640px; height: 480px; background: #000; display: block; margin: 10px; border: 2px solid #0f0; order: 1; }
    .track { margin: 10px; padding: 10px; border: 1px solid #666; display: flex; flex-direction: column; }
    audio { width: 640px; display: block; margin: 5px 10px 10px 10px; order: 2; }
    #log { margin-top: 20px; padding: 10px; background: #333; font-size: 12px; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }
  </style>
</head>
<body>
  <h1>LiveKit SFU Viewer</h1>
  <input id="room" value="myroom">
  <input id="name" value="viewer">
  <button id="joinBtn">Join</button>
  <button id="leaveBtn" disabled>Leave</button>
  <div id="videos"></div>
  <div id="log">Ready...</div>
  <script>
    var room;
    var logged = [];
    
    function log(msg) {
      logged.push(msg);
      document.getElementById('log').textContent = '[' + logged.length + '] ' + msg + '\\n' + document.getElementById('log').textContent;
      console.log(msg);
    }

    document.getElementById('joinBtn').addEventListener('click', async () => {
      logged = [];
      log('Getting token...');
      
      var resp = await fetch('/getToken', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          room: document.getElementById('room').value,
          identity: document.getElementById('name').value
        })
      });
      var data = await resp.json();
      if (!data.token) { log('ERROR: No token'); return; }
      log('Token OK, creating Room...');

      room = new LivekitClient.Room();

      room.on('connected', function() { log('=== CONNECTED ==='); });
      room.on('disconnected', function() { log('=== DISCONNECTED ==='); });

      room.on('trackSubscribed', function(track, pub, participant) {
        log('>>> SUBSCRIBED: ' + track.kind + ' from ' + participant.identity);

        var partDiv = document.getElementById('p-' + participant.identity);
        if (!partDiv) {
          partDiv = document.createElement('div');
          partDiv.id = 'p-' + participant.identity;
          partDiv.className = 'track';
          partDiv.innerHTML = '<strong>' + participant.identity + '</strong>';
          document.getElementById('videos').appendChild(partDiv);
        }

        if (track.kind === 'video') {
          var existingVideo = partDiv.querySelector('video');
          if (!existingVideo) {
            videoEl = document.createElement('video');
            videoEl.autoplay = true;
            videoEl.controls = true;
            videoEl.muted = true;
            videoEl.playsInline = true;
            partDiv.appendChild(videoEl);
          } else {
            videoEl = existingVideo;
          }
          track.attach(videoEl);
          log('    attached: YES');
        } else if (track.kind === 'audio') {
          var audioEl = document.createElement('audio');
          audioEl.controls = true;
          audioEl.muted = true;
          var existingVideo = partDiv.querySelector('video');
          if (existingVideo) {
            partDiv.insertBefore(audioEl, existingVideo.nextSibling);
          } else {
            partDiv.appendChild(audioEl);
          }
          track.attach(audioEl);
          log('    attached: YES');
        }
      });

      room.on('participantConnected', function(participant) {
        log('>>> PARTICIPANT CONNECTED: ' + participant.identity);
      });

      room.on('participantDisconnected', function(participant) {
        log('>>> PARTICIPANT DISCONNECTED: ' + participant.identity);
      });

      const wsUrl = "${BROWSER_WS_URL}";
      log('Connecting to ' + wsUrl + '...');
      await room.connect(wsUrl, data.token);
      log('Connected! Remote participants: ' + room.participants.size);

      document.getElementById('joinBtn').disabled = true;
      document.getElementById('leaveBtn').disabled = false;
    });

    document.getElementById('leaveBtn').addEventListener('click', function() {
      if (room) {
        room.disconnect();
        document.getElementById('videos').innerHTML = '';
        document.getElementById('joinBtn').disabled = false;
        document.getElementById('leaveBtn').disabled = true;
        log('Left');
      }
    });
  </script>
</body>
</html>`);
  } else if (req.url === '/favicon.ico') {
    try {
      const favicon = fs.readFileSync('./favicon.ico');
      res.writeHead(200, {'Content-Type': 'image/x-icon'});
      res.end(favicon);
    } catch (e) {
      res.writeHead(404);
      res.end('Not Found');
    }
  } else if (req.url === '/config') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({ wsUrl: BROWSER_WS_URL }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(3000, () => console.log('SFU Viewer at http://127.0.0.1:3000'));
