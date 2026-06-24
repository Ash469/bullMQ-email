require('dotenv').config();
const { BulkEmailRunner } = require('./index');

async function test() {
  const runner = new BulkEmailRunner({
    // Uses process.env variables by default if null
    redis: null, 
    smtp: null
  });

  console.log("=== Testing BulkEmailRunner ===");
  
  // Test Mode with simple HTML
  console.log("\nSending test email with simple HTML...");
  await runner.send({
    mode: 'test',
    testEmail: process.env.TEST_EMAIL || 'your-test-email@example.com',
    mailTemplate: {
      fromName: 'Techniche Team',
      subject: 'BulkEmailRunner Test',
      html: '<p>This is a test email sent from the newly structured package!</p>',
      text: 'This is a test email sent from the newly structured package!'
    }
  });
}

test().catch(console.error);
