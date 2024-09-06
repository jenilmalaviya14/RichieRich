const { logError, logDebug } = require('../common-services/log-common.service');
const { executeQuery } = require('../../db/db-query');

const getGeneralSettings = async () => {
    try {
        const sql = `SELECT * FROM general_setting ORDER BY id LIMIT 1`;
        const results = await executeQuery(sql);
        if (results) {
            const [[generalSettings]] = results;
            return generalSettings;
        }
        return null;
    } catch (error) {
        logError("Error in getGeneralSettings() function:", error);
        return null;
    }
}

const updateRoundCloseRunningInfo = async (isRoundCloseRunning) => {
    try {
        const sql = `UPDATE general_setting
            SET isRoundCloseRunning = ${isRoundCloseRunning}`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in updateRoundCloseRunning() function:", error);
        return null;
    }
}

const updateFallbackCountInfo = async () => {
    try {
        const sql = `UPDATE general_setting
            SET fallbackSkipCount = IFNULL(fallbackSkipCount, 0) + 1`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in updateFallbackCountInfo() function:", error);
        return null;
    }
}

const updateFallbackCountResetInfo = async () => {
    try {
        const sql = `UPDATE general_setting
            SET fallbackSkipCount = 0`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in updateFallbackCountResetInfo() function:", error);
    }
}

const updateLastSyncBlockNumberInfo = async (blockNumber) => {
    try {
        const sql = `UPDATE general_setting
            SET lastSyncBlockNumber = ${blockNumber}`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in updateLastSyncBlockNumberInfo() function:", error);
    }
}

const getTransactionQueueCountAndSeconds = async () => {
    try {
        const sql = `SELECT queueProcessCount, queueWaitSeconds FROM general_setting ORDER BY id LIMIT 1`;
        const results = await executeQuery(sql);
        if (results) {
            const [[transactionQueue]] = results;
            return transactionQueue;
        }
        return null;
    } catch (error) {
        logError("Error in getTransactionQueueCountAndSeconds() function:", error);
    }
};

module.exports = {
    getGeneralSettings,
    updateRoundCloseRunningInfo,
    updateFallbackCountInfo,
    updateFallbackCountResetInfo,
    getTransactionQueueCountAndSeconds,
    updateLastSyncBlockNumberInfo
}