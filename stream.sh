#!/bin/bash
    gst-launch-1.0 \
  livekitwebrtcsrc \
    signaller::ws-url=ws://127.0.0.1:7880 \
    signaller::api-key=devkey \
    signaller::secret-key=secretsecretsecretsecretsecretsecretsecret \
    signaller::room-name=myroom \
    signaller::identity=gst-subscriber \
  ! queue ! videoconvert ! autovideosink
