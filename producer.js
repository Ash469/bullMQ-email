require('dotenv').config();
const { Queue } = require('bullmq');
const fs = require('fs');
const csv = require('csv-parser');
const IORedis = require('ioredis');

async function loadEmailsAndEnqueue(csvFilePath, redisOptions) {
  // Connect to Redis
  const connection = new IORedis(redisOptions || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
  });

  // Initialize Queue
  const emailQueue = new Queue('emailQueue', { connection });

  const emails = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv()) // Use first row as header 
      .on('data', (row) => {
        if (row.email && row.email.trim() !== '') {
          emails.push(row.email.trim());
        }
      })
      .on('end', async () => {
        console.log(`CSV reading complete. Total emails found: ${emails.length}`);
        
        console.log('Adding jobs to the queue...');

        const logInterval = Math.max(1, Math.floor(emails.length / 10));
        
        for (let i = 0; i < emails.length; i++) {
          await emailQueue.add('sendEmail', {
            to: emails[i]
          }, {
            removeOnComplete: true,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 5000
            }
          });
          
          if ((i + 1) % logInterval === 0 || i === emails.length - 1) {
             console.log(`Progress: Added ${i + 1} / ${emails.length} jobs to queue...`);
          }
        }
        console.log('All jobs have been added to the queue.');
        await connection.quit();
        resolve();
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      });
  });
}

// If run directly via `node producer.js`
if (require.main === module) {
  // csv path to run the producer 
  loadEmailsAndEnqueue('emails.csv').catch(console.error);
}

module.exports = { loadEmailsAndEnqueue };
