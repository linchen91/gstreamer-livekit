# GStreamer LiveKit Streaming

Stream audio/video from GStreamer to LiveKit WebRTC rooms using the `livekitwebrtcsink` and `livekitwebrtcsrc` GStreamer elements.

## Requirements

- [LiveKit Server](https://livekit.io/) running locally (port 7880)
- GStreamer with livekitwebrtc plugins installed
- Node.js (for the token server)

## Quick Start

### 1. Start LiveKit Server

```bash
./docker-livekit.sh
```

This starts a local LiveKit server with the development key/secret:
- **API Key:** `devkey`
- **API Secret:** `secretsecretsecretsecretsecretsecretsecret`
- **WebSocket URL:** `ws://127.0.0.1:7880`

### 2. Start the Token Server

```bash
node server.js
```

The server runs at `http://127.0.0.1:3000` and provides JWT tokens for authentication.

### 3. Stream Content to LiveKit

**From webcam:**
```bash
./stream-publisher.sh
```

**From MP4 file (with audio):**
```bash
./stream-av.sh
```

**Subscribe to stream:**
Open `http://127.0.0.1:3000` in a browser, or use `viewer.html` directly connected to LiveKit.

## Scripts

| Script | Description |
|--------|-------------|
| `docker-livekit.sh` | Start LiveKit server in Docker |
| `server.js` | HTTP server with token generation endpoint |
| `stream.sh` | Subscribe to a LiveKit room using GStreamer |
| `stream-cam.sh` | Stream webcam to LiveKit room |
| `stream-av.sh` | Stream MP4 file (video + audio) to LiveKit room |
| `stream-publisher.sh` | Stream webcam + audio to LiveKit using gstreamer-publisher (requires gstreamer-publisher binary) |
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

## Configuration

Edit the shell scripts to customize:
- `room-name`: The LiveKit room to join
- `identity`: Participant identity
- `api-key` / `secret-key`: Authentication credentials

## License

MIT
