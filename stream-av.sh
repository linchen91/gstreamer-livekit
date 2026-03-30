#!/bin/bash
while true; do
gst-launch-1.0 filesrc location="video-audio-stereo.mp4" ! qtdemux name=demux \
demux.video_0 ! queue ! h264parse ! avdec_h264 ! videoconvert ! vp8enc ! queue ! \
livekitwebrtcsink name=sink \
signaller::ws-url="ws://127.0.0.1:7880" \
signaller::api-key="devkey" \
signaller::secret-key="secretsecretsecretsecretsecretsecretsecret" \
signaller::room-name="myroom" \
signaller::identity="gst-producer" \
signaller::participant-name="myname" \
video-caps='video/x-vp8' \
audio-caps='audio/x-opus,channel-mapping-family=0' \
demux.audio_0 ! queue ! aacparse ! avdec_aac ! audioconvert ! audioresample ! opusenc ! queue ! \
sink.
done
