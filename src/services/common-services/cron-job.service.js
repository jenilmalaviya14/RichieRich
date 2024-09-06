
const cron = require('node-cron');
const { listenForTransactionBlockWiseTransactionHash, processRunningTransactionsUpdateStatus } = require("./transaction-common.service");
const { updateProcessMissingData } = require("../database-services/tier-db.service");

cron.schedule('0 */1 * * *', listenForTransactionBlockWiseTransactionHash, {
    scheduled: true,
    timezone: 'UTC'
});

cron.schedule('0 */12 * * *', updateProcessMissingData, {
    scheduled: true,
    timezone: 'UTC'
});

cron.schedule('*/15 * * * *', processRunningTransactionsUpdateStatus, {
    scheduled: true,
    timezone: 'UTC'
});