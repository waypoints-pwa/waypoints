# waypoints sync server. Build from the repo root:
#   docker build -f server/Dockerfile -t waypoints-server .
# Docker Hub's official Node image, through Google's mirror of Docker Hub: CI runners share IP
# addresses and often hit Docker Hub's limit on anonymous pulls.
FROM mirror.gcr.io/library/node:24-alpine

WORKDIR /app
ENV NODE_ENV=production \
    DATA_DIR=/data \
    FILES_DIR=/files \
    PORT=8788

# The server has no dependencies: it runs its TypeScript directly (Node type stripping) and shares
# the app's record checks, so only those source files are copied in.
RUN echo '{"type":"module"}' > package.json
COPY src/db/types.ts ./src/db/types.ts
COPY src/domain ./src/domain
COPY server/src ./server/src

# /data: the trip database and the server code (small, written on every change).
# /files: daily copies of the database (documents and photos later), which can be on another disk.
# Runs as root so bind-mounted folders created by Docker (e.g. from a NAS GUI) are always writable.
VOLUME ["/data", "/files"]
EXPOSE 8788
HEALTHCHECK --interval=1m --timeout=5s CMD wget -qO- http://127.0.0.1:8788/api/health || exit 1
CMD ["node", "server/src/main.ts"]
