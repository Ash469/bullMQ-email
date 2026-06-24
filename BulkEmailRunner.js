const { loadEmailsAndEnqueue } = require('./producer');
const { startWorker } = require('./worker');

class BulkEmailRunner {
  constructor(config = {}) {
    this.redisOptions = config.redis;
    this.smtpConfigs = config.smtp;
  }

  async send(options = {}) {
    const { mode = 'production', testEmail, csvPath, mailTemplate = {} } = options;

    const compiledTemplate = {
      fromName: mailTemplate.fromName || 'System',
      subject: mailTemplate.subject || 'No Subject',
      html: mailTemplate.html || '',
      text: mailTemplate.text || ''
    };

    // Start worker
    console.log('Starting worker process...');
    const worker = startWorker(this.redisOptions, this.smtpConfigs, compiledTemplate);

    // Start producer
    console.log(`Starting producer in ${mode} mode...`);
    await loadEmailsAndEnqueue({
      mode,
      testEmail,
      csvFilePath: csvPath,
      redisOptions: this.redisOptions
    });

    console.log('Setup complete. Worker is actively processing jobs.');
    return worker;
  }
}

module.exports = { BulkEmailRunner };
