require('dotenv').config();
const { Worker } = require('bullmq');
const nodemailer = require('nodemailer');
const IORedis = require('ioredis');

function startWorker(redisOptions, smtpConfigs, mailTemplate = {}) {
  // Redis connection
  const connection = new IORedis(redisOptions || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null
  });

  // SMTP transporters
  const configs = smtpConfigs || [
    { user: process.env.SMTP_USER_1, pass: process.env.SMTP_PASS_1 },
    { user: process.env.SMTP_USER_2, pass: process.env.SMTP_PASS_2 }
  ];
  
  const transporters = configs.map(config => 
    nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: config.user,
        pass: config.pass
      }
    })
  );

let currentTransporterIndex = 0;

// Round-Robin select a transporter
function getNextTransporter() {
  const transporter = transporters[currentTransporterIndex];
  currentTransporterIndex = (currentTransporterIndex + 1) % transporters.length;
  return transporter;
}

// Start the worker
const worker = new Worker('emailQueue', async job => {
  const { to } = job.data;
  const transporter = getNextTransporter();
  
  const senderEmail = transporter.transporter.options.auth.user;
  
  const mailOptions = {
    from: `"${mailTemplate.fromName || 'System'}" <${senderEmail}>`,
    to: to,
    subject: mailTemplate.subject || 'No Subject',
    text: mailTemplate.text || '',
    html: mailTemplate.html || ''
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Job ${job.id}] Sent to ${to} via ${senderEmail} - MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId, sender: senderEmail };
  } catch (error) {
    console.error(`[Job ${job.id}] Failed to send to ${to} via ${senderEmail}: ${error.message}`);
    throw error;
  }
}, { 
  connection,
  // Concurrency defines how many jobs this worker processes at the exact same time
  concurrency: 5, 
  limiter: {
    max: 5,  //max 2 emails in 10 sec as per google 
    duration: 10000 
  }
});

worker.on('completed', (job, returnvalue) => {
  console.log(`Job ${job.id} completed!`);
});

  worker.on('failed', (job, error) => {
    console.log(`Job ${job.id} failed with error: ${error.message}`);
  });

  console.log('Worker is running and waiting for jobs...');
  return worker;
}

if (require.main === module) {
  startWorker();
}

module.exports = { startWorker };
