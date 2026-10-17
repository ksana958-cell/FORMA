FROM node:24-bookworm-slim
WORKDIR /opt/forma
COPY . .
ENV NODE_ENV=production
ENV DATA_DIR=/app/data
EXPOSE 3000
CMD ["node", "app.js"]
