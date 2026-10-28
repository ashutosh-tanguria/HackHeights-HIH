# Blue team runner: the defence rules exist ONLY in this image (not in the gateway, not in Red).
# Build context = repository root (see docker-compose.yml).
FROM node:22-alpine
RUN mkdir -p /app /secrets && chown 10002:10002 /secrets
COPY runners/sandbox-runner.mjs /app/runner.mjs
COPY runners/blue-rules.json /app/blue-rules.json
ENV ROLE=blue NODE_ENV=production
WORKDIR /app
USER 10002:10002
EXPOSE 8081
CMD ["node", "/app/runner.mjs", "serve"]
