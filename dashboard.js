require('dotenv').config();
const express = require('express');
const { Queue } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const IORedis = require('ioredis');

function startDashboard(redisOptions, portOptions) {
  // Connect to Redis
  const connection = new IORedis(redisOptions || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
  });

  // Create the queue instance
  const emailQueue = new Queue('emailQueue', { connection });

// Setup Bull Board
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

const { addQueue, removeQueue, setQueues, replaceQueues } = createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

const app = express();

app.use('/admin/queues', serverAdapter.getRouter());

  const PORT = portOptions || process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Running on ${PORT}...`);
    console.log(`For the UI, open http://localhost:${PORT}/admin/queues`);
  });

  return { app, server };
}

if (require.main === module) {
  startDashboard();
}

module.exports = { startDashboard };
