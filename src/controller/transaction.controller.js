const { saveTransactionQueueInfo } = require('../services/database-services/transaction-queue-db.service');
const { logError, logDebug } = require('../services/common-services/log-common.service');
const { getProviderAndTransactions, getAndCalcTransactionDetailsFromTransactionQueueHash, getAndSaveTransactionInfoFromTransactionHash } = require('../services/common-services/transaction-common.service')

const saveTransactionHashInQueue = async (req, res) => {
    try {
        let transactionHashQueue = []
        const transactionHashes = req.body.transactionHashes
        transactionHashQueue = await saveTransactionQueueInfo(transactionHashes);
        res.status(200).json({
            success: true,
            message: "All Data Saved Successfully.",
            data: transactionHashQueue
        });
    } catch (error) {
        logError("Error in saveTransactionHashInQueue() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const transactionHashLogInfo = async (req, res) => {
    try {
        const transactionHash = req.body.transactionHash
        const data = await getProviderAndTransactions(transactionHash, false);
        res.status(200).json({
            success: true,
            message: "All Data Saved Successfully.",
            data: data.transaction
        });
    } catch (error) {
        logError("Error in transactionHashLogInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const saveTransactionInfoFromTransactionHash = async (req, res) => {
    try {
        const transactionHash = req.body.transactionHash
        if (!transactionHash) {
            res.status(400).json({
                success: false,
                message: "transactionHash Not Found in Request"
            });
        }

        const transactionHashProcessed = await getAndSaveTransactionInfoFromTransactionHash([transactionHash]);
        if (transactionHashProcessed.length > 0) {
            res.status(200).json({
                success: true,
                message: "Transaction Info Saved Successfully.",
                data: { transactionHash: transactionHashProcessed[0] }
            });
        } else {
            res.status(200).json({
                success: false,
                message: "Transaction Info could not be saved.",
                data: { transactionHash: null }
            });
        }
    } catch (error) {
        logError("Error in saveTransactionInfoFromTransactionHash() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    saveTransactionHashInQueue,
    transactionHashLogInfo,
    saveTransactionInfoFromTransactionHash
};