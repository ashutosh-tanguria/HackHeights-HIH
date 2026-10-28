# Red team runner: plain Node, no package manager, non-root, nothing but the runner script.
# Build context = repository root (see docker-compose.yml).
FROM node:22-alpine
RUN mkdir -p /app /payloads && chown 10001:10001 /payloads
COPY runners/sandbox-runner.mjs /app/runner.mjs
ENV ROLE=red NODE_ENV=production
WORKDIR /app
USER 10001:10001
EXPOSE 8080
CMD ["node", "/app/runner.mjs", "serve"]
