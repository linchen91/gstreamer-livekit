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
./stream-cam.sh
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
| `viewer.html` | Browser-based viewer (standalone) |

## Architecture

```
[GStreamer] ---> [LiveKit SFU] ---> [Browser/Viewer]
   (source)        (server)          (subscriber)
```

- **Producer:** GStreamer with `livekitwebrtcsink` element pushes audio/video to LiveKit
- **SFU:** LiveKit server handles routing to subscribers
- **Subscriber:** Browser or GStreamer with `livekitwebrtcsrc` consumes the stream

## Configuration

Edit the shell scripts to customize:
- `room-name`: The LiveKit room to join
- `identity`: Participant identity
- `api-key` / `secret-key`: Authentication credentials

## License

MIT
