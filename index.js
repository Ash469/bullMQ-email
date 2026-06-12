const { loadEmailsAndEnqueue } = require('./producer');
const { startWorker } = require('./worker');
const { startDashboard } = require('./dashboard');

module.exports = {
  loadEmailsAndEnqueue,
  startWorker,
  startDashboard
};
