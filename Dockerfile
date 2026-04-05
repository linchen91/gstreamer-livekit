FROM mpisat/gstreamer-publisher:full

USER root

RUN apt-get update && apt-get install -y \
    v4l2loopback-dkms \
    git \
    ca-certificates \
    jq \
    curl \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN curl -sSL https://get.livekit.io | bash

ENV PATH="/root/go/bin:${PATH}"
ENV GST_PLUGIN_PATH=/usr/lib/x86_64-linux-gnu/gstreamer-1.0
ENV GST_DEBUG=2

WORKDIR /app
COPY package*.json ./
COPY server.js ./
COPY stream*.sh ./
COPY viewer.html ./
COPY favicon.ico ./

RUN npm install && chmod +x stream*.sh

EXPOSE 3000 7880 7881 7882

CMD ["npm", "start"]
