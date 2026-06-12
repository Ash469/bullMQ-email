# Bulk Email BullMQ Runner

A robust and scalable bulk email sender built on top of [BullMQ](https://docs.bullmq.io/), [Redis](https://redis.io/), and [Nodemailer](https://nodemailer.com/). It efficiently handles queueing and uses a round-robin strategy across multiple SMTP accounts to send emails reliably. It also comes with a built-in UI Dashboard (via `@bull-board`) to monitor your queues.

## Features

- **Queue Management**: Powered by BullMQ for high-performance job queueing.
- **Round-Robin SMTP**: Uses multiple SMTP credentials to avoid hitting rate limits on a single account.
- **CSV Support**: Easily read recipients from a `.csv` file.
- **Admin Dashboard**: Visual dashboard to monitor active, completed, failed, and delayed jobs.
- **Reusable as a Package**: Can be run as a standalone app or imported into your own Node.js projects.

## Prerequisites

- **Node.js** (v14 or higher recommended)
- **Redis Server** (You can use the provided `docker-compose.yml` to spin one up)

## 🚀 Standalone Usage

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd BullMQ
npm install
```

### 2. Configure Environment
Rename `.env.example` to `.env` and fill in your details:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

SMTP_USER_1=your_first_email@gmail.com
SMTP_PASS_1=your_first_app_password
SMTP_USER_2=your_second_email@gmail.com
SMTP_PASS_2=your_second_app_password

PORT=3000
```

### 3. Start Redis
If you have Docker installed, you can start a local Redis instance easily:
```bash
docker-compose up -d
```

### 4. Run the Services
You need to run the Worker (to process jobs), the Dashboard (to view queues), and the Producer (to add jobs).

Open three separate terminals and run:

**Terminal 1: Start the Dashboard**
```bash
node dashboard.js
# UI will be available at http://localhost:3000/admin/queues
```

**Terminal 2: Run the Producer**
```bash
# Make sure you have your emails in emails.csv (with an 'email' column header)
node producer.js
```

**Terminal 3: Start the Worker**
```bash
node worker.js
# Worker will wait for jobs in the background
```


```


## 📦 Using as a Package (NPM Module)

### Installation
```bash
npm install <your-github-username>/<repo-name>
# or 
# npm install bulk-email-bullmq-runner
```

### Usage Example
You can import the core functions into any of your existing Node applications:

```javascript
const { loadEmailsAndEnqueue, startWorker, startDashboard } = require('bulk-email-bullmq-runner');

// 1. Start the Dashboard UI on a custom port
startDashboard(
  { host: '127.0.0.1', port: 6379 }, // Redis Options
  4000 // Port for the dashboard
);

// 2. Start the Worker with custom SMTP credentials
startWorker(
  { host: '127.0.0.1', port: 6379 }, // Redis Options
  [
    { user: 'sender1@gmail.com', pass: 'pass1' },
    { user: 'sender2@gmail.com', pass: 'pass2' }
  ]
);

// 3. Enqueue Emails from a CSV file
loadEmailsAndEnqueue('path/to/your/list.csv', { host: '127.0.0.1', port: 6379 })
  .then(() => console.log('All emails queued up!'))
  .catch(console.error);
```

## Contributing
Feel free to open issues or submit pull requests for any improvements!

##
Made by Ayush Shandilya 