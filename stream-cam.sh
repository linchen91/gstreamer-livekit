#!/bin/bash
gst-launch-1.0 -v \
v4l2src device=/dev/video0 ! \
image/jpeg,framerate=30/1,width=1280,height=720 ! \
jpegdec ! \
videoconvert ! \
x264enc tune=zerolatency key-int-max=60 bitrate=2000 ! \
video/x-h264 ! \
h264parse ! \
queue ! \
livekitwebrtcsink name=sink \
signaller::ws-url="ws://127.0.0.1:7880" \
signaller::api-key="devkey" \
signaller::secret-key="secretsecretsecretsecretsecretsecretsecret" \
signaller::room-name="myroom" \
signaller::identity="gst-producer" \
signaller::participant-name="myname" \
video-caps='video/x-h264' \
audio-caps='audio/x-opus,channel-mapping-family=0' \
pulsesrc device=@DEFAULT_SOURCE@ ! \
audioconvert ! \
audioresample ! \
opusenc ! \
queue ! \
sink.
