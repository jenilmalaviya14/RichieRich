const ethers = require("ethers");
const lotterABI = require("../../abi/lotter.abi.json");
const { logError, logDebug } = require("./log-common.service");
const { convertBigAmountToSmallAmount } = require("./utility-common.service");
const { insertParticipatedInfo, updatePrizeClaimInfo, updateRoundCloseInfo, updateMilestoneBonusReleasedInfo, checkRoundWiseTicketsCount, checkParticipatedEventExists, updateParticipatedEventInfo, updateProcessMissingData, insertTicketListInfo } = require("../database-services/tier-db.service");
const { getGeneralSettings } = require("../database-services/general-setting-db.service")
const { insertRoundBlockNumber, updateRoundToBlockNumber, checkRoundBlockNumberExists, getRoundBlockNumbers } = require("../database-services/round-block-number-db.service")
const { updateRoundCloseRunningInfo } = require("../database-services/general-setting-db.service")
const { getProvider } = require("./provider-common.service")
const { ROUND_WISE_TICKETS_COUNT } = require("../../config/lottery-constants.config");

const checkAndProcessParticipatedEvent = async (eventInfo) => {
    try {
        const { args, transactionHash, blockNumber } = eventInfo

        await checkAndInsertRoundBlockNumber(args.tier, args.roundId, blockNumber);

        const isParticipated = await checkParticipatedEventExists(args.tier, args.ticketId);

        if (!isParticipated) {
            await processAndSaveParticipatedEventData(eventInfo);
        } else {
            if (!isParticipated.participantAddress && args.userAddress) {
                const convertedEntryFee = convertBigAmountToSmallAmount(args.entryFee);
                const convertedRefferalBonus = convertBigAmountToSmallAmount(args.refferalBonus);

                const participateData = {
                    participantAddress: args.userAddress,
                    tierId: args.tier,
                    roundNo: args.roundId,
                    ticketNo: args.ticketId,
                    entryFee: convertedEntryFee,
                    referralAddress: args.refferedBy,
                    refferalBonus: convertedRefferalBonus,
                    transactionHash
                }
                await updateParticipatedEventInfo(participateData)
            }
        }
        return { success: true, message: "", eventType: "Participated" };
    } catch (error) {
        logError("Error in checkAndProcessParticipatedEvent() function:", error);
        return { success: false, message: error, eventType: "Participated" };
    }
};

const checkAndInsertRoundBlockNumber = async (tierId, roundNo, blockNumber) => {
    try {
        // const existingRoundBlockNumber = await checkRoundBlockNumberExists(tierId, roundNo);

        // if (!existingRoundBlockNumber) {
        await insertRoundBlockNumber(tierId, roundNo, blockNumber)
        // }
    } catch (error) {
        logError("Error in checkAndInsertRoundBlockNumber() function:", error);
    }
};

const processAndSaveParticipatedEventData = async (eventInfo) => {
    try {
        logDebug("processAndSaveParticipatedEventData eventInfo", eventInfo);
        const { args, transactionHash } = eventInfo;
        logDebug("processAndSaveParticipatedEventData args", args);
        const convertedEntryFee = convertBigAmountToSmallAmount(args.entryFee);
        const convertedRefferalBonus = convertBigAmountToSmallAmount(args.refferalBonus);

        const participateData = {
            participantAddress: args.userAddress,
            tierId: args.tier,
            roundNo: args.roundId,
            ticketNo: args.ticketId,
            entryFee: convertedEntryFee,
            referralAddress: args.refferedBy,
            refferalBonus: convertedRefferalBonus,
            transactionHash
        }
        await insertParticipatedInfo(participateData);

    } catch (error) {
        logError("Error in processAndSaveParticipatedEventData() function:", error);
    }
};

const processAndSavePrizeClaimedEvent = async (eventInfo) => {
    try {
        logDebug("processAndSavePrizeClaimedEvent eventInfo", eventInfo)
        const { args, transactionHash } = eventInfo;
        const convertedprizeAmount = convertBigAmountToSmallAmount(args.prizeAmount);

        const prizeClaimedData = {
            participantAddress: args.userAddress,
            tierId: args.tier,
            roundNo: args.roundId,
            ticketNo: args.ticketId,
            prizeAmount: convertedprizeAmount,
            transactionHash
        };
        await updatePrizeClaimInfo(prizeClaimedData);

    } catch (error) {
        logError("Error in processAndSavePrizeClaimedEvent() function:", error);
    }
};

const processAndSaveRoundClosedEvent = async (eventInfo, contract) => {
    try {
        console.log("processAndSaveRoundClosedEvent eventInfo", eventInfo);

        const { args, transactionHash, blockNumber } = eventInfo;
        const tierId = Number(args.tier);
        const roundNo = Number(args.roundId);

        logDebug("processAndSaveRoundClosedEvent eventInfo", eventInfo)

        await updateRoundCloseRunningInfo(1)
        logDebug("processAndSaveRoundClosedEvent updateRoundCloseRunningInfo success", 1)

        await updateRoundToBlockNumber(tierId, roundNo, blockNumber);
        logDebug("processAndSaveRoundClosedEvent updateRoundToBlockNumber success")

        await updateProcessMissingData();
        logDebug("processAndSaveRoundClosedEvent updateProcessMissingData success")

        const ticketsCount = await checkRoundWiseTicketsCount(tierId, roundNo)
        if (ticketsCount < ROUND_WISE_TICKETS_COUNT) {
            logDebug("processAndSaveRoundClosedEvent ticketsCount", ticketsCount)
            await getTransactionBlockWiseTransactionHash(tierId, roundNo)
        }

        await insertTicketListInfo(tierId, roundNo)
        logDebug("processAndSaveRoundClosedEvent insertTicketListInfo success");

        const prizeDetails = await contract.getPrizeMoney(tierId);
        const firstPrizeWinner = await contract.getFirstPrizeWinnerList(tierId, roundNo);
        logDebug("processAndSaveRoundClosedEvent firstPrizeWinner", firstPrizeWinner)
        const convertedFirstPrizeAmount = convertBigAmountToSmallAmount(prizeDetails.fPrizeAmount);

        if (firstPrizeWinner) {
            await checkAndProcessFirstWinnerParticipatedEvent(eventInfo, BigInt(firstPrizeWinner))

            const winnerInfo = {
                tierId,
                roundNo,
                ticketNo: BigInt(firstPrizeWinner),
                winningPosition: 1,
                prizeAmount: convertedFirstPrizeAmount,
                transactionHash: eventInfo.transactionHash
            }
            logDebug("processAndSaveRoundClosedEvent FirstwinnerInfo", winnerInfo)
            await updateRoundCloseInfo(winnerInfo);
        }

        const secondPrizeWinners = await contract.getSecondPrizeWinnerList(tierId, roundNo);
        logDebug("processAndSaveRoundClosedEvent secondPrizeWinners", secondPrizeWinners)
        const convertedSecondPrizeAmount = convertBigAmountToSmallAmount(prizeDetails.sPrizeAmount);

        if (secondPrizeWinners.length > 0) {
            const winnerInfo = {
                tierId,
                roundNo,
                ticketNo: `${secondPrizeWinners.join(",")}`,
                winningPosition: 2,
                prizeAmount: convertedSecondPrizeAmount,
                transactionHash
            }
            logDebug("processAndSaveRoundClosedEvent SecondwinnerInfo", winnerInfo)
            await updateRoundCloseInfo(winnerInfo);
        }

        const thirdPrizeWinners = await contract.getThirdPrizeWinnerList(tierId, roundNo);
        logDebug("processAndSaveRoundClosedEvent thirdPrizeWinners", thirdPrizeWinners)
        const convertedThirdPrizeAmount = convertBigAmountToSmallAmount(prizeDetails.tPrizeAmount);

        if (thirdPrizeWinners.length > 0) {
            const winnerInfo = {
                tierId,
                roundNo,
                ticketNo: `${thirdPrizeWinners.join(",")}`,
                winningPosition: 3,
                prizeAmount: convertedThirdPrizeAmount,
                transactionHash
            }
            logDebug("processAndSaveRoundClosedEvent ThirdwinnerInfo", winnerInfo)
            await updateRoundCloseInfo(winnerInfo);
        }
    } catch (error) {
        logError("Error in processAndSaveRoundClosedEvent() function:", error);
    }

    try {
        await updateRoundCloseRunningInfo(0)
        logDebug("processAndSaveRoundClosedEvent updateRoundCloseRunningInfo success", 0)
    } catch (error) {
        logError("Error in processAndSaveRoundClosedEvent() => updateRoundCloseRunningInfo() function:", error);
    }
};

const processAndSaveMilestoneBonusReleasedEvent = async (eventInfo) => {
    try {
        console.log("processAndSaveMilestoneBonusReleasedEvent eventInfo", eventInfo);
        const { args, transactionHash } = eventInfo;
        const convertedWonAmount = convertBigAmountToSmallAmount(args.wonAmount);

        const isParticipated = await checkParticipatedEventExists(args.tier, args.ticketId);

        if (!isParticipated) {
            await processAndSaveParticipatedEventData(eventInfo);
        }

        const milestoneReleasedData = {
            milestoneWinnerAddress: args.winner,
            tierId: args.tier,
            roundNo: args.roundId,
            ticketNo: args.ticketId,
            wonAmount: convertedWonAmount,
            transactionHash
        };
        await updateMilestoneBonusReleasedInfo(milestoneReleasedData);

    } catch (error) {
        logError("Error in processAndSaveMilestoneBonusReleasedEvent() function:", error);
    }
};

const checkAndProcessFirstWinnerParticipatedEvent = async (eventInfo, ticketNo) => {
    try {
        const { args } = eventInfo
        const isParticipated = await checkParticipatedEventExists(args.tier, ticketNo);
        logDebug("checkAndProcessFirstWinnerParticipatedEvent isParticipated", isParticipated)

        if (!isParticipated) {
            const participateData = {
                ...eventInfo,
                args: {
                    ...args,
                    ticketId: ticketNo
                }
            }
            logDebug("checkAndProcessFirstWinnerParticipatedEvent participateData", participateData)
            await processAndSaveParticipatedEventData(participateData);
        }
    } catch (error) {
        logError("Error in checkAndProcessFirstWinnerParticipatedEvent() function:", error);
    }
};

const getTransactionBlockWiseTransactionHash = async (tierId, roundNo) => {
    try {
        logDebug("getTransactionBlockWiseTransactionHash Started")
        const generalSettings = await getGeneralSettings()

        // const secondsAgo = (generalSettings.fetchMinutesAgoBlock ?? 0) * 60; // 5 = days (7200 minutes)
        const maxBlockOffset = generalSettings.maxBlockOffset ?? 0;
        // const platFormAverageBlockSeconds = generalSettings.platFormAverageBlockSeconds ?? 0 // general settings

        if (maxBlockOffset > 0) {
            logDebug("Start Processing of getTransactionBlockWiseTransactionHash");

            const roundBlockNumbers = await getRoundBlockNumbers(tierId, roundNo);
            const fromBlockNumber = roundBlockNumbers.fromBlockNumber ?? 0
            let toBlockNumber = roundBlockNumbers.toBlockNumber ?? 0

            if (toBlockNumber == 0) {
                toBlockNumber = await provider.getBlockNumber();
                logDebug("getTransactionBlockWiseTransactionHash toBlockNumber = latestBlockNumber", toBlockNumber)
            }

            if (fromBlockNumber > 0 && toBlockNumber > 0) {

                // const url = process.env.RPC_URL;
                const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
                // const provider = new ethers.providers.WebSocketProvider(url);
                const provider = getProvider();
                const contract = new ethers.Contract(lotteryAddress, lotterABI, provider);

                // const latestBlockNumber = await provider.getBlockNumber();
                // logDebug("getTransactionBlockWiseTransactionHash latestBlockNumber", latestBlockNumber)

                // const blockDiff = secondsAgo / platFormAverageBlockSeconds
                // const startingBlockNumber = Math.floor(latestBlockNumber - blockDiff)
                // logDebug("getTransactionBlockWiseTransactionHash startingBlockNumber", startingBlockNumber);

                logDebug("getTransactionBlockWiseTransactionHash fromBlockNumber", fromBlockNumber)
                logDebug("getTransactionBlockWiseTransactionHash toBlockNumber", toBlockNumber)

                const processingBlocks = Math.ceil((toBlockNumber - fromBlockNumber) / maxBlockOffset)
                logDebug("getTransactionBlockWiseTransactionHash processingBlocks", processingBlocks)

                for (let blockNumber = 0; blockNumber < processingBlocks; blockNumber++) {
                    let fromBlock = fromBlockNumber + (blockNumber * maxBlockOffset)
                    let toBlock = fromBlock + maxBlockOffset;
                    if (blockNumber > 0) {
                        fromBlock++
                    }
                    if (toBlock > toBlockNumber) {
                        toBlock = toBlockNumber
                    }
                    logDebug("getTransactionBlockWiseTransactionHash fromBlock", fromBlock);
                    logDebug("getTransactionBlockWiseTransactionHash toBlock", toBlock);

                    await getAndUpdateEventTransactionFromBlockNumber(contract, fromBlock, toBlock, tierId, roundNo)
                }
            }
        }
        logDebug("getTransactionBlockWiseTransactionHash Ended")
    } catch (error) {
        logError("getTransactionBlockWiseTransactionHash Error:", error)
    }
};

const getAndUpdateEventTransactionFromBlockNumber = async (contract, fromBlock, toBlock, tierId, roundNo) => {
    try {
        const events = ['Participated'];

        for (const event of events) {
            const eventFilter = contract.filters[event]();
            const eventLogs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

            if (eventLogs.length > 0) {
                logDebug("getAndUpdateEventTransactionFromBlockNumber", eventLogs);
            }
            for (const eventInfo of eventLogs) {
                // const transactionHash = eventInfo.transactionHash;
                if (eventInfo.topics.length > 0) {
                    const topicAddress = eventInfo.topics[0];
                    // const existingTransactionHash = await checkTransactionHashExists({ transactionHash });

                    // logDebug("existingTransactionHash", existingTransactionHash);
                    // if (existingTransactionHash.length === 0) {
                    if (topicAddress === process.env.PARTICIPATED_TOPICS_ADDRESS) {
                        const { args } = eventInfo
                        // logDebug("getAndUpdateEventTransactionFromBlockNumber args", args)
                        if (tierId == Number(args.tier) && roundNo == Number(args.roundId)) {
                            await checkAndProcessParticipatedEvent(eventInfo);
                        }
                    };
                }
                // }
            }
        }
    } catch (error) {
        logError("Error in getAndUpdateEventTransactionFromBlockNumber() function:", error);
    }
}

module.exports = {
    checkAndProcessParticipatedEvent,
    processAndSaveParticipatedEventData,
    processAndSavePrizeClaimedEvent,
    processAndSaveRoundClosedEvent,
    processAndSaveMilestoneBonusReleasedEvent
}