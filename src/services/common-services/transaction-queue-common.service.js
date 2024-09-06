const { getTransactionHashQueueList } = require('../database-services/transaction-queue-db.service');
const { getTransactionQueueCountAndSeconds } = require('../database-services/general-setting-db.service');
const { getAndCalcTransactionDetailsFromTransactionQueueHash } = require('./transaction-common.service');
const { logError, logDebug } = require('./log-common.service');
const sleep = require('sleep-promise')

const startTransactionQueueProcess = async () => {
    try {
        const queueSettings = await getTransactionQueueCountAndSeconds();
        if (queueSettings && queueSettings.queueProcessCount > 0) {
            logDebug("startTransactionQueueProcess");
            const queueWaitMiliSeconds = queueSettings.queueWaitSeconds * 1000
            let isQueueProcessed = false
            while (!isQueueProcessed) {
                // console.log("isQueueProcessed", new Date());

                const transactionHashes = await getTransactionHashQueueList(queueSettings.queueProcessCount);
                await getAndCalcTransactionDetailsFromTransactionQueueHash(transactionHashes, true);

                await sleep(queueWaitMiliSeconds);
            }
        }
    } catch (error) {
        logError("Error in startTransactionQueueProcess() function:", error);
    }
};

// startTransactionQueueProcess();

module.exports = {
    startTransactionQueueProcess
}