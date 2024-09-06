const { logDebug, logError } = require('../common-services/log-common.service');
const { executeQuery } = require('../../db/db-query');

const insertParticipatedInfo = async (ParticipateData) => {
    try {
        logDebug("insertParticipatedInfo ParticipateData", ParticipateData);

        const { participantAddress, tierId, roundNo, ticketNo, entryFee, referralAddress, refferalBonus, transactionHash } = ParticipateData;
        let sql = `
            INSERT INTO buy_ticket_list
            (tierId, roundNo, ticketNo, entryFee, refferalBonus, participatedTxHash
            `;
        if (participantAddress) sql += `, participantAddress`;
        if (referralAddress) sql += `, referralAddress`;

        sql += `, participatedOn) VALUES`;
        sql += ` ( ${tierId}, ${roundNo}, ${ticketNo}, ${entryFee}, ${refferalBonus}, '${transactionHash}'`;

        if (participantAddress) sql += `, '${participantAddress}'`;
        if (referralAddress) sql += `, '${referralAddress}'`;
        sql += `, UTC_TIMESTAMP())`;

        logDebug("insertParticipatedInfo sql", sql);
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in insertParticipatedInfo() function:", error);
        return false;
    }
};

const updatePrizeClaimInfo = async (PrizeClaimData) => {
    try {
        logDebug("updatePrizeClaimInfo PrizeClaimData", PrizeClaimData)

        const { tierId, ticketNo, prizeAmount, transactionHash } = PrizeClaimData;
        const sql = `
            UPDATE buy_ticket_list
            SET claimStatus = 1,
                prizeAmount = ${prizeAmount},
                prizeClaimedTxHash = '${transactionHash}',
                prizeClaimedOn = UTC_TIMESTAMP()
            WHERE tierId = ${tierId} AND ticketNo = ${ticketNo}
        `;
        logDebug("updatePrizeClaimInfo sql", sql)
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updatePrizeClaimInfo() function:", error);
        return false;
    }
};

const updateRoundCloseInfo = async (roundCloseData) => {
    try {
        logDebug("updateMilestoneBonusReleasedInfo roundCloseData", roundCloseData);

        const { tierId, ticketNo, winningPosition, prizeAmount, transactionHash } = roundCloseData;
        const sql = `
            UPDATE buy_ticket_list
            SET winningPosition = ${winningPosition},
                prizeAmount = ${prizeAmount},
                roundClosedTxHash = '${transactionHash}',
                winnerDeclaredOn = UTC_TIMESTAMP()
            WHERE tierId = ${tierId} AND ticketNo IN (${ticketNo})
        `;
        logDebug("updateRoundCloseInfo sql", sql)
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updateRoundCloseInfo() function:", error);
        return false;
    }
};

const updateMilestoneBonusReleasedInfo = async (milestoneBonusData) => {
    try {
        logDebug("updateMilestoneBonusReleasedInfo milestoneBonusData", milestoneBonusData);

        const { tierId, ticketNo, wonAmount, transactionHash } = milestoneBonusData;
        const sql = `
        UPDATE buy_ticket_list
        SET milestoneWonAmount = ${wonAmount},
        isMilestoneWinner= 1,
        milestoneReleasedTxHash = '${transactionHash}',
        milestoneReleasedOn = UTC_TIMESTAMP()
        WHERE tierId = ${tierId} AND ticketNo = ${ticketNo}
        `;
        logDebug("updateMilestoneBonusReleasedInfo sql", sql)
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updateMilestoneBonusReleasedInfo() function:", error);
        return false;
    }
};

const updateProcessMissingData = async () => {
    try {
        const sql = `CALL process_missing_data()`;
        logDebug("updateProcessMissingData sql", sql);
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updateProcessMissingData() function:", error);
        return false;
    }
};

const checkTransactionHashExists = async (tierData) => {
    try {
        const { transactionHash } = tierData;
        const sql = `SELECT * FROM buy_ticket_list
                    WHERE participatedTxHash = '${transactionHash}' OR roundClosedTxHash = '${transactionHash}' OR prizeClaimedTxHash = '${transactionHash}' OR milestoneReleasedTxHash = '${transactionHash}'
                `;
        const results = await executeQuery(sql);
        if (results) {
            const [existingTierData] = results;
            return existingTierData;
        }
        return null;
    } catch (error) {
        logError("Error in checkTransactionHashExists() function:", error);
    }
};

const checkParticipatedEventExists = async (tierId, ticketId) => {
    try {
        const sql = `SELECT * FROM buy_ticket_list WHERE tierId = ${tierId} AND ticketNo = ${ticketId}`;
        const results = await executeQuery(sql);
        if (results) {
            const [[existingParticipatedData]] = results;
            return existingParticipatedData;
        }
        return null;
    } catch (error) {
        logError("Error in checkParticipatedEventExists() function:", error);
    }
};

const updateParticipatedEventInfo = async (ParticipateData) => {
    try {
        logDebug("updateParticipatedEventInfo ParticipateData", ParticipateData);

        const { participantAddress, tierId, roundNo, ticketNo, entryFee, referralAddress, refferalBonus, transactionHash } = ParticipateData;
        let sql = `
            UPDATE buy_ticket_list
            SET roundNo = ${roundNo}
            , entryFee = ${entryFee}
            , refferalBonus = ${refferalBonus}
            , participatedTxHash = '${transactionHash}'
        `;

        if (participantAddress) sql += `, participantAddress = '${participantAddress}'`;
        if (referralAddress) sql += `, referralAddress = '${referralAddress}'`;

        sql += ` WHERE tierId = ${tierId} AND ticketNo = ${ticketNo}`;

        logDebug("updateParticipatedEventInfo sql", sql);

        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updateParticipatedEventInfo() function:", error);
        return false;
    }
};

const checkRoundClosedCount = async (tierId, roundId) => {
    try {
        const sql = `SELECT COUNT(*) as winnerCount
            FROM buy_ticket_list
            WHERE tierId = ${tierId} AND roundNo = ${roundId} AND winningPosition IN (1, 2, 3)`;
        logDebug("checkRoundClosedCount sql", sql);

        const results = await executeQuery(sql);
        if (results) {
            const [[countResult]] = results;
            return countResult.winnerCount;
        }
        return null;
    } catch (error) {
        logError("Error in checkRoundClosedCount() function:", error);
    }
};

const checkRoundWiseTicketsCount = async (tierId, roundId) => {
    try {
        const sql = `SELECT COUNT(*) as winnerCount
            FROM buy_ticket_list
            WHERE tierId = ${tierId} AND roundNo = ${roundId}`;
        logDebug("checkRoundWiseTicketsCount sql", sql);

        const results = await executeQuery(sql);
        if (results) {
            const [[countResult]] = results;
            return countResult.winnerCount;
        }
        return null;
    } catch (error) {
        logError("Error in checkRoundClosedCount() function:", error);
    }
};

const checkPrizeClamied = async (tierId, ticketId) => {
    try {
        const sql = `SELECT tierId FROM buy_ticket_list WHERE tierId = ${tierId} AND ticketNo = ${ticketId} AND claimStatus = 1`;
        logDebug("checkPrizeClamied sql", sql);

        const results = await executeQuery(sql);
        if (results) {
            const [existingPrizeClamiedData] = results;
            return existingPrizeClamiedData.length > 0;
        }
        return null;
    } catch (error) {
        logError("Error in checkPrizeClamied() function:", error);
    }
};

const checkMilestoneBonusReleased = async (tierId, ticketId) => {
    try {
        const sql = `SELECT tierId FROM buy_ticket_list WHERE tierId = ${tierId} AND ticketNo = ${ticketId} AND isMilestoneWinner = 1`;
        logDebug("checkMilestoneBonusReleased sql", sql);

        const results = await executeQuery(sql);
        if (results) {
            const [existingMilestoneRelasedData] = results;
            return existingMilestoneRelasedData.length > 0;
        }
        return 0;
    } catch (error) {
        logError("Error in checkMilestoneBonusReleased() function:", error);
        return 0;
    }
};

const insertTicketListInfo = async (tierId, roundNo) => {
    try {
        const sql = `CALL insert_ticket_info(${tierId}, ${roundNo})`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in insertTicketListInfo() function:", error);
    }
};

const getTicketListInfo = async (tierId, roundNo, participantAddress) => {
    try {
        const sql = `CALL get_ticket_info(${tierId}, ${roundNo}, '${participantAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[finalResults]] = results;
            return finalResults;
        }
        return null;
    } catch (error) {
        logError("Error in getTicketListInfo() function:", error);
        return null;
    }
};

const getWinnerInfo = async (tierId, roundNo) => {
    try {
        const sql = `CALL get_winner_info(${tierId}, ${roundNo})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[finalResults]] = results;
            return finalResults;
        }
        return null;
    } catch (error) {
        logError("Error in getWinnerInfo() function:", error);
        return null;
    }
};

const getMilestoneBonusWinnerInfo = async (tierId, roundNo) => {
    try {
        const sql = `
            SELECT
                id,
                roundNo,
                ticketNo,
                participantAddress,
                claimStatus,
                isMilestoneWinner
            FROM buy_ticket_list
            WHERE tierId = ${tierId} AND roundNo = ${roundNo} AND isMilestoneWinner = 1
            ORDER BY ticketNo DESC
            LIMIT 1
        `;
        const results = await executeQuery(sql);
        if (results) {
            const [[finalResults]] = results;
            return finalResults;
        }
        return null;
    } catch (error) {
        logError("Error in getMilestoneBonusWinnerInfo() function:", error);
        return null
    }
}

const getTierAndTicketWiseInfo = async (tierId, tickets) => {
    try {
        const ticketsString = Array.isArray(tickets) && tickets.length > 0 ? tickets.join(',') : 0;

        const sql = `SELECT *
                    FROM buy_ticket_list
                    WHERE tierId = ${tierId}
                          AND ticketNo IN (${ticketsString})`;

        const results = await executeQuery(sql);
        if (results) {
            const [finalResults] = results;
            return finalResults;
        }
        return null;
    } catch (error) {
        console.error("Error in getTierAndTicketWiseInfo() function:", error);
        return null;
    }
};

const getClaimableTicketsFromTicketInfo = async (tierId, roundNo, participantAddress) => {
    try {
        const sql = `CALL get_claimable_tickets(${tierId}, ${roundNo}, '${participantAddress}')`;

        const results = await executeQuery(sql);
        if (results) {
            const [finalResults] = results;
            return finalResults;
        }
        return null;
    } catch (error) {
        logError("Error in getClaimableTicketsFromTicketInfo() function:", error);
        return null;
    }
};

module.exports = {
    insertParticipatedInfo,
    updateParticipatedEventInfo,
    updateRoundCloseInfo,
    updatePrizeClaimInfo,
    updateMilestoneBonusReleasedInfo,
    updateProcessMissingData,
    checkTransactionHashExists,
    checkParticipatedEventExists,
    checkRoundClosedCount,
    checkRoundWiseTicketsCount,
    checkPrizeClamied,
    checkMilestoneBonusReleased,
    insertTicketListInfo,
    getTicketListInfo,
    getWinnerInfo,
    getMilestoneBonusWinnerInfo,
    getTierAndTicketWiseInfo,
    getClaimableTicketsFromTicketInfo
};