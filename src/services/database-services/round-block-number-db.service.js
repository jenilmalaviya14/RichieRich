const { logDebug, logError } = require('../common-services/log-common.service');
const { executeQuery } = require('../../db/db-query');

const insertRoundBlockNumber = async (tierId, roundNo, blockNumber) => {
    // try {
    //     const sql = `
    //             INSERT INTO round_wise_blocknumber (tierId, roundNo, fromBlockNumber)
    //             VALUES (${tierId}, ${roundNo}, ${blockNumber})
    //         `;
    //     await db.execute(sql);
    // } catch (error) {
    //     logError("Error in insertRoundBlockNumber() function:", error);
    // }
    try {
        const sql = `CALL insert_round_wise_blocknumber(${tierId}, ${roundNo}, ${blockNumber})`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in insertRoundBlockNumber() function:", error);
        return null;
    }
};

const updateRoundToBlockNumber = async (tierId, roundNo, blockNumber) => {
    try {
        const sql = `
            UPDATE round_wise_blocknumber
            SET toBlockNumber = ${blockNumber}
            WHERE tierId = ${tierId} AND roundNo = ${roundNo} AND IFNULL(toBlockNumber, 0) = 0
        `;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in updateRoundToBlockNumber() function:", error);
    }
};

const checkRoundBlockNumberExists = async (tierId, roundNo) => {
    try {
        const sql = `
            SELECT fromBlockNumber, toBlockNumber
            FROM round_wise_blocknumber
            WHERE tierId = ${tierId} AND roundNo = ${roundNo}
        `;

        const results = await executeQuery(sql);
        if (results) {
            const [finalResults] = results;
            return finalResults.length > 0;
        }
        return 0;
    } catch (error) {
        logError("Error in checkRoundBlockNumberExists() function:", error);
        return 0;
    }
};

const getRoundBlockNumbers = async (tierId, roundNo) => {
    try {
        const sql = `
            SELECT fromBlockNumber, toBlockNumber
            FROM round_wise_blocknumber
            WHERE tierId = ${tierId} AND roundNo = ${roundNo}
        `;
        const results = await executeQuery(sql);
        if (results) {
            const [[finalResults]] = results;
            return finalResults;
        }
        return null;
    } catch (error) {
        logError("Error in getRoundBlockNumbers() function:", error);
        return null;
    }
};

module.exports = { insertRoundBlockNumber, updateRoundToBlockNumber, checkRoundBlockNumberExists, getRoundBlockNumbers }