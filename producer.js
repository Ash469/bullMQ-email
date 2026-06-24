require('dotenv').config();
const { Queue } = require('bullmq');
const fs = require('fs');
const csv = require('csv-parser');
const IORedis = require('ioredis');

async function loadEmailsAndEnqueue(options = {}) {
  const { 
    mode = 'production', 
    testEmail = null, 
    csvFilePath, 
    redisOptions 
  } = options;

  // Connect to Redis
  const connection = new IORedis(redisOptions || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
  });

  // Initialize Queue
  const emailQueue = new Queue('emailQueue', { connection });

  if (mode === 'test') {
    if (!testEmail) {
      await connection.quit();
      throw new Error('testEmail is required when mode is "test"');
    }
    
    console.log(`[TEST MODE] Adding single job for ${testEmail}...`);
    await emailQueue.add('sendEmail', { to: testEmail }, {
      removeOnComplete: { age: 24 * 3600, count: 5000 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });
    console.log('Test job added to the queue.');
    await connection.quit();
    return;
  }

  if (!csvFilePath) {
    await connection.quit();
    throw new Error('csvFilePath is required when mode is "production"');
  }

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
            // Keep up to 5000 completed jobs for 24 hours so you can see them in the Dashboard
            removeOnComplete: {
              age: 24 * 3600, 
              count: 5000
            },
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
      .on('error', async (error) => {
        console.error('Error reading CSV:', error);
        await connection.quit();
        reject(error);
      });
  });
}

// If run directly via `node producer.js`
if (require.main === module) {
  // csv path to run the producer 
  loadEmailsAndEnqueue({ csvFilePath: 'emails.csv' }).catch(console.error);
}

module.exports = { loadEmailsAndEnqueue };
