const { processAndSavePrizeClaimedEvent, processAndSaveRoundClosedEvent, processAndSaveMilestoneBonusReleasedEvent } = require("./process-lottery-event-common.service");
const { checkPrizeClamied, checkRoundClosedCount, checkMilestoneBonusReleased } = require("../database-services/tier-db.service");
const { logDebug, logError } = require('./log-common.service')
const { WINNER_TOTAL_COUNT } = require("../../config/lottery-constants.config");

const checkAndProcessPrizeClaimedEvent = async (eventInfo) => {
    try {
        const isPrizeClamied = await checkPrizeClamied(eventInfo.args.tier, eventInfo.args.ticketId);

        if (!isPrizeClamied) {
            await processAndSavePrizeClaimedEvent(eventInfo);
        }
        return { success: true, message: "", eventType: "PrizeClamied" };
    } catch (error) {
        logError("Error in checkAndProcessPrizeClaimedEvent() function:", error);
        return { success: false, message: error, eventType: "PrizeClamied" };
    }
}

const checkAndProcessRoundClosedEvent = async (eventInfo, contract) => {
    try {
        const winnerCount = await checkRoundClosedCount(eventInfo.args.tier, eventInfo.args.roundId);
        if (winnerCount >= WINNER_TOTAL_COUNT) {
            return;
        }
        logDebug("checkAndProcessRoundClosedEvent winnerCount", winnerCount);

        await processAndSaveRoundClosedEvent(eventInfo, contract);
        return { success: true, message: "", eventType: "RoundClosed" };

    } catch (error) {
        logError("Error in checkAndProcessRoundClosedEvent() function:", error);
        return { success: false, message: error, eventType: "RoundClosed" };
    }
}

const checkAndProcessMilestoneBonusReleasedEvent = async (eventInfo) => {
    try {
        const isMilestoneBonusReleased = await checkMilestoneBonusReleased(eventInfo.args.tier, eventInfo.args.ticketId);

        if (!isMilestoneBonusReleased) {
            await processAndSaveMilestoneBonusReleasedEvent(eventInfo);
        }
        return { success: true, message: "", eventType: "MilestoneBonusReleased" };
    } catch (error) {
        logError("Error in checkAndProcessMilestoneBonusReleasedEvent() function:", error);
        return { success: false, message: error, eventType: "MilestoneBonusReleased" };
    }
}

module.exports = {
    checkAndProcessPrizeClaimedEvent,
    checkAndProcessRoundClosedEvent,
    checkAndProcessMilestoneBonusReleasedEvent
}