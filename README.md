# Bulk Email BullMQ Runner

A robust and scalable bulk email sender built on top of [BullMQ](https://docs.bullmq.io/), [Redis](https://redis.io/), and [Nodemailer](https://nodemailer.com/). It efficiently handles queueing and uses a round-robin strategy across multiple SMTP accounts to send emails reliably. It also comes with a built-in UI Dashboard (via `@bull-board`) to monitor your queues.

## Features

- **Queue Management**: Powered by BullMQ for high-performance job queueing.
- **Round-Robin SMTP**: Uses multiple SMTP credentials to avoid hitting rate limits on a single account.
- **CSV Support**: Easily read recipients from a `.csv` file.
- **Admin Dashboard**: Visual dashboard to monitor active, completed, failed, and delayed jobs.
- **Reusable as a Package**: Dynamic template support so you can inject your own HTML and text per campaign.

## Prerequisites

- **Node.js** (v14 or higher recommended)
- **Redis Server**: BullMQ **requires** a Redis server to manage the email queues. If you don't have a paid cloud Redis server, the easiest and completely free way to run it locally is using Docker.

### Setting up a Free Local Redis Server (via Docker)
To prevent the package from crashing, you must have Redis running before sending emails. 

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Create a `docker-compose.yml` file in your project root with the following content:
   ```yaml
   version: '3.8'
   services:
     redis:
       image: redis:alpine
       ports:
         - "6379:6379"
   ```
3. Open your terminal in that directory and start Redis in the background:
   ```bash
   docker-compose up -d
   ```
This will instantly spin up a local Redis server on `127.0.0.1:6379` that the package will automatically connect to!

## 📦 Using as a Package

This package is published to GitHub Packages under the `@ash469` scope.

### Authentication

To install this package, you must authenticate with GitHub Packages. Add an `.npmrc` file in your project root with the following:

```
@ash469:registry=https://npm.pkg.github.com
```

### Installation
```bash
npm install @ash469/bulk-email-bullmq-runner
```

### Usage Example (How to pass your HTML)

You can import the `BulkEmailRunner` class and inject your own HTML content dynamically! The runner supports a `test` mode to send a quick preview to a single email, and a `production` mode to blast the emails out from your CSV.

```javascript
const { BulkEmailRunner, startDashboard } = require('@ash469/bulk-email-bullmq-runner');

// 1. Initialize the runner
// Note: If you leave config empty, it falls back to your .env process variables
const runner = new BulkEmailRunner({
  redis: { host: '127.0.0.1', port: 6379 },
  smtp: [
    { user: 'sender1@gmail.com', pass: 'pass1' },
    { user: 'sender2@gmail.com', pass: 'pass2' }
  ]
});

// 2. Define your custom HTML template
const myCustomHtml = `
  <h1>Hello from the Package!</h1>
  <p>This is where you put your own custom HTML.</p>
`;

// 3. Send a single TEST email
runner.send({
  mode: 'test',
  testEmail: 'your-personal-test-email@example.com',
  mailTemplate: {
    fromName: 'My Awesome Company',
    subject: 'This is a test preview',
    html: myCustomHtml,
    text: 'Fallback plain text version'
  }
}).then(() => console.log('Test email queued!'));

/* 
// 4. Or send in PRODUCTION mode using a CSV file
runner.send({
  mode: 'production',
  csvPath: './my-subscribers.csv',
  mailTemplate: {
    fromName: 'My Awesome Company',
    subject: 'Our Latest Newsletter!',
    html: myCustomHtml,
    text: 'Fallback plain text version'
  }
}).then(() => console.log('Bulk emails queued!'));
*/

// Optional: Start the Dashboard UI on port 3000
startDashboard({ host: '127.0.0.1', port: 6379 }, 3000);
```

## Contributing
Feel free to open issues or submit pull requests for any improvements!

##
Made by Ayush Shandilya 