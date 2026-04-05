# GStreamer LiveKit Streaming

Stream audio/video from GStreamer to LiveKit WebRTC rooms using the `livekitwebrtcsink` and `livekitwebrtcsrc` GStreamer elements.

## Requirements

- [LiveKit Server](https://livekit.io/) running locally (port 7880)
- GStreamer with livekitwebrtc plugins installed
- Node.js (for the token server)

## Quick Start (Docker Compose)

The easiest way to run everything is using docker-compose:

```bash
# Start all services (LiveKit server + token server)
docker compose up -d

# View logs
docker compose logs -f

# Stop services
docker compose down
```

This starts:
- **LiveKit server** on ports 7880 (WS), 7881 (TCP), 7882 (UDP)
- **Token server** on http://localhost:3000

### Camera and Microphone Support

To enable camera and microphone access, edit `docker-compose.yml` and uncomment the devices section:

```yaml
services:
  gstreamer-livekit:
    devices:
      - /dev/video0:/dev/video0
      - /dev/snd:/dev/snd
```

Then rebuild and restart:
```bash
docker compose up -d --build
```

## Quick Start (Docker)

The easiest way to run everything is using the Docker container:

```bash
# Build the Docker image
docker build -t gstreamer-livekit .

# Create network for container communication
docker network rm -f livekit-net 2>/dev/null; docker network create livekit-net

# Start LiveKit server (if not already running)
docker rm -f dot-livekit 2>/dev/null; docker run -d -p 7880:7880 -p 7881:7881 -p 7882:7882/udp --name dot-livekit --network livekit-net -e LIVEKIT_KEYS="devkey: secretsecretsecretsecretsecretsecretsecret" livekit/livekit-server:latest --dev

# Run the container with camera and audio devices
 docker rm -f gstreamer-livekit 2>/dev/null; docker run -d -p 3000:3000 --name gstreamer-livekit \
  --device=/dev/video0 --device=/dev/video1 \
  --device=/dev/snd --group-add audio \
  --network livekit-net \
  --entrypoint node gstreamer-livekit:latest server.js
```

The Docker container includes:
- Node.js token server (port 3000)
- GStreamer with `gstreamer-publisher` tool
- Pre-configured with development keys

Open `http://127.0.0.1:3000` in a browser to view streams.

### Running Stream Scripts in Container

To stream content with camera and microphone, exec into the container:

```bash
# Stream from webcam + microphone
docker exec gstreamer-livekit sh -c 'TOKEN=$(cd /app && NODE_PATH=/app/node_modules node -e "
const { AccessToken } = require(\"livekit-server-sdk\");
const API_KEY = \"devkey\";
const API_SECRET = \"secretsecretsecretsecretsecretsecretsecret\";
const token = new AccessToken(API_KEY, API_SECRET, {identity: \"gst-producer\", name: \"gst-producer\"});
token.addGrant({roomJoin: true, room: \"myroom\", canPublish: true, canSubscribe: true});
token.toJwt().then(t => console.log(t));
"); gstreamer-publisher --url "ws://dot-livekit:7880" --token "$TOKEN" -- "v4l2src device=/dev/video0 ! jpegdec ! videoconvert ! x264enc tune=zerolatency speed-preset=ultrafast bframes=0 key-int-max=30" "alsasrc device=hw:0 ! audioconvert ! audioresample ! opusenc bitrate=64000"'
```

Or use the test sources (no camera/mic required):
```bash
# Stream with test pattern and sine wave audio
docker exec gstreamer-livekit sh -c 'TOKEN=$(cd /app && NODE_PATH=/app/node_modules node -e "
const { AccessToken } = require(\"livekit-server-sdk\");
const API_KEY = \"devkey\";
const API_SECRET = \"secretsecretsecretsecretsecretsecretsecret\";
const token = new AccessToken(API_KEY, API_SECRET, {identity: \"gst-producer\", name: \"gst-producer\"});
token.addGrant({roomJoin: true, room: \"myroom\", canPublish: true, canSubscribe: true});
token.toJwt().then(t => console.log(t));
"); gstreamer-publisher --url "ws://dot-livekit:7880" --token "$TOKEN" -- "videotestsrc ! video/x-raw,framerate=30/1,width=1280,height=720 ! x264enc tune=zerolatency speed-preset=ultrafast bframes=0 key-int-max=30" "audiotestsrc ! audioconvert ! audioresample ! opusenc bitrate=64000"'
```

**Note:** The container must be run with `--device=/dev/video0` for camera and `--device=/dev/snd --group-add audio` for microphone access.

### Dockerfile

The Dockerfile uses `mpisat/gstreamer-publisher:full` as the base image and includes:

- **Base**: GStreamer with Rust plugins (gstreamer-publisher)
- **System packages**: v4l2loopback-dkms, git, ca-certificates, jq, curl, nodejs, npm
- **LiveKit CLI**: Installed via `curl -sSL https://get.livekit.io | bash`
- **Application**: Copies server.js, stream*.sh, viewer.html, and installs npm dependencies
- **Ports**: 3000 (token server), 7880-7882 (LiveKit if needed)
- **Entrypoint**: Note - the base image has `gstreamer-publisher` as ENTRYPOINT, so use `--entrypoint node` to run the token server

**Important**: The Dockerfile doesn't include a LiveKit server. Use a separate container (`dot-livekit`) or an external LiveKit server.

### Streaming Sources

**Test pattern (no camera required):**
```bash
docker exec gstreamer-livekit-gstreamer-livekit-1 sh -c 'TOKEN=$(cd /app && NODE_PATH=/app/node_modules node -e "
const { AccessToken } = require(\"livekit-server-sdk\");
const API_KEY = \"devkey\";
const API_SECRET = \"secretsecretsecretsecretsecretsecretsecret\";
const token = new AccessToken(API_KEY, API_SECRET, {identity: \"gst-producer\", name: \"gst-producer\"});
token.addGrant({roomJoin: true, room: \"myroom\", canPublish: true, canSubscribe: true});
token.toJwt().then(t => console.log(t));
"); gstreamer-publisher --url "ws://livekit:7880" --token "$TOKEN" -- "videotestsrc ! video/x-raw,framerate=30/1,width=1280,height=720 ! x264enc tune=zerolatency speed-preset=ultrafast bframes=0 key-int-max=30" "audiotestsrc ! audioconvert ! audioresample ! opusenc bitrate=64000"'
```

**Camera + Microphone:**
```bash
docker exec gstreamer-livekit-gstreamer-livekit-1 sh -c 'TOKEN=$(cd /app && NODE_PATH=/app/node_modules node -e "
const { AccessToken } = require(\"livekit-server-sdk\");
const API_KEY = \"devkey\";
const API_SECRET = \"secretsecretsecretsecretsecretsecretsecret\";
const token = new AccessToken(API_KEY, API_SECRET, {identity: \"gst-producer\", name: \"gst-producer\"});
token.addGrant({roomJoin: true, room: \"myroom\", canPublish: true, canSubscribe: true});
token.toJwt().then(t => console.log(t));
"); gstreamer-publisher --url "ws://livekit:7880" --token "$TOKEN" -- "v4l2src device=/dev/video0 ! jpegdec ! videoconvert ! x264enc tune=zerolatency speed-preset=ultrafast bframes=0 key-int-max=30" "alsasrc device=hw:0 ! audioconvert ! audioresample ! opusenc bitrate=64000"'
```

Then open http://localhost:3000 in a browser to view the stream.

## Quick Start (Manual)

### 1. Start LiveKit Server

```bash
docker run -d -p 7880:7880 -p 7881:7881 -p 7882:7882/udp --name dot-livekit -e LIVEKIT_KEYS="devkey: secretsecretsecretsecretsecretsecretsecret" livekit/livekit-server:latest --dev
```

This starts a local LiveKit server with the development key/secret:
- **API Key:** `devkey`
- **API Secret:** `secretsecretsecretsecretsecretsecretsecret`
- **WebSocket URL:** `ws://127.0.0.1:7880` (from host) or `ws://dot-livekit:7880` (from Docker)

### 2. Start the Token Server

```bash
node server.js
```

The server runs at `http://127.0.0.1:3000` and provides JWT tokens for authentication.

### 3. Stream Content to LiveKit

**From webcam + microphone (requires local GStreamer):**
```bash
# Generate token and run gstreamer-publisher
./stream-publisher.sh
```

**From test sources (no camera/mic required):**
```bash
./stream-av.sh
```

**Subscribe to stream:**
Open `http://127.0.0.1:3000` in a browser, or use `viewer.html` directly connected to LiveKit.

## Scripts

| Script | Description |
|--------|-------------|
| `docker-compose.yml` | Orchestrates LiveKit server and token server |
| `Dockerfile` | Container definition for gstreamer-livekit |
| `server.js` | HTTP server with token generation endpoint |
| `stream.sh` | Subscribe to a LiveKit room using GStreamer |
| `stream-cam.sh` | Stream webcam to LiveKit room |
| `stream-av.sh` | Stream MP4 file (video + audio) to LiveKit room |
| `stream-publisher.sh` | Stream webcam + audio to LiveKit using gstreamer-publisher |
| `viewer.html` | Browser-based viewer (standalone) |

## Architecture

```
[GStreamer] ---> [LiveKit SFU] ---> [Browser/Viewer]
   (source)        (server)          (subscriber)
```

- **Producer:** GStreamer with `livekitwebrtcsink` element pushes audio/video to LiveKit
- **SFU:** LiveKit server handles routing to subscribers
- **Subscriber:** Browser or GStreamer with `livekitwebrtcsrc` consumes the stream

## Multiple Viewers

LiveKit SFU supports multiple concurrent viewers. You can open multiple browser tabs or windows pointing to `http://127.0.0.1:3000` to watch the same stream simultaneously. Each viewer receives its own WebRTC connection via the SFU.

To test with multiple viewers:
1. Start the publisher (e.g., `./stream-cam.sh` or `./stream-publisher.sh`)
2. Open multiple browser tabs at `http://127.0.0.1:3000`
3. Enter the same room name (e.g., `myroom`) and different identities for each viewer

The SFU automatically handles:
- Distributing the stream to all connected viewers
- Managing individual WebRTC connections
- Handling viewer join/leave events

## Device Requirements

For camera and microphone access, the host machine must have:
- **Video**: `/dev/video0` (webcam)
- **Audio**: ALSA sound device (`/dev/snd`)

Run the container with device flags:
```bash
docker run -d -p 3000:3000 --name gstreamer-livekit \
  --device=/dev/video0 \
  --device=/dev/snd --group-add audio \
  --network livekit-net \
  --entrypoint node gstreamer-livekit:latest server.js
```

## Configuration

Edit the shell scripts to customize:
- `room-name`: The LiveKit room to join
- `identity`: Participant identity
- `api-key` / `secret-key`: Authentication credentials

## Docker Network Setup

When running both `gstreamer-livekit` and LiveKit server in Docker, containers must be on the same network to communicate via hostnames:

```bash
# Create network
docker network create livekit-net

# Connect both containers
docker network connect livekit-net dot-livekit
docker network connect livekit-net gstreamer-livekit
```

Then use `ws://dot-livekit:7880` (not `127.0.0.1:7880`) in the gstreamer-publisher command.

## Troubleshooting

**"Device busy" errors**: Kill any other processes using the camera:
```bash
pkill -9 gstreamer
```

**Module not found**: When running inside the container, set NODE_PATH:
```bash
NODE_PATH=/app/node_modules node -e "..."
```

**Connection refused**: Ensure both containers are on the same Docker network and use container names as hostnames.

## License

MIT
