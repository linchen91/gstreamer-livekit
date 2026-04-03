#!/bin/bash
export LIVEKIT_URL="ws://127.0.0.1:7880"
export LIVEKIT_PUBLISH_TOKEN=$(lk token create --room myroom --identity gst-producer --join --valid-for 24h --url http://127.0.0.1:7880 --api-key devkey --api-secret secretsecretsecretsecretsecretsecretsecret --token-only)
# encode type: x264enc, need to test further types: vp9enc, x265enc, avenc_av1 or av1enc
export ENCODE_TYPE=x264enc

gstreamer-publisher --url "$LIVEKIT_URL" --token "$LIVEKIT_PUBLISH_TOKEN" -- \
  "v4l2src device=/dev/video0 ! image/jpeg,framerate=30/1,width=1280,height=720 ! jpegdec ! videoconvert ! $ENCODE_TYPE tune=zerolatency speed-preset=ultrafast bframes=0 key-int-max=30" \
  "alsasrc device=hw:0 ! audioconvert ! audioresample ! opusenc bitrate=64000"
