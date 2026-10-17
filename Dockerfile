FROM node:24-bookworm-slim
WORKDIR /opt/forma
COPY . .
# Fail during build if a GitHub upload flattened the folders.
RUN test -s src/worker.js || (echo "FORMA ERROR: missing src/worker.js; upload the src folder to GitHub" && exit 1)
RUN test -s public/index.html || (echo "FORMA ERROR: missing public/index.html; upload the public folder to GitHub" && exit 1)
RUN test -s scripts/setup-telegram.mjs || (echo "FORMA ERROR: missing scripts/ directory; upload the scripts folder to GitHub" && exit 1)
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
EXPOSE 3000
CMD ["node", "app.js"]
