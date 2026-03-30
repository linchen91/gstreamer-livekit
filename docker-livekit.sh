docker run -d -p 7880:7880 -p 7881:7881 -p 7882:7882/udp --name dot-livekit -e LIVEKIT_KEYS="devkey: secretsecretsecretsecretsecretsecretsecret"   livekit/livekit-server:latest --dev
