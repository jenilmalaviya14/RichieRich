const ethers = require("ethers");
const lotterABI = require("../../abi/lotter.abi.json");
const { getGeneralSettings, updateFallbackCountInfo, updateFallbackCountResetInfo, updateLastSyncBlockNumberInfo } = require("../database-services/general-setting-db.service");
const { checkTransactionHashExists } = require("../database-services/tier-db.service");
const { logDebug, logError } = require('./log-common.service');
const { checkAndProcessParticipatedEvent } = require('./process-lottery-event-common.service');
const { checkAndProcessPrizeClaimedEvent, checkAndProcessRoundClosedEvent, checkAndProcessMilestoneBonusReleasedEvent } = require('./tier-event-processors-common.service');
const { getProvider } = require('./provider-common.service');
const { updateTransactionQueueForRunning, updateTransactionQueueForSuccess, updateTransactionQueueForFail, insertOrUpdateTransactionQueueForFail, saveTransactionQueueInfo, findRunningTransactionsUpdateStatus, updateRunningTransactionsToFailAfterThresholdExceed, updateTransactionQueueErrorMessage } = require('../database-services/transaction-queue-db.service');
const { TRANSACTION_TIMEOUT_SECONDS } = require('../../config/lottery-constants.config')

const listenForTransactionBlockWiseTransactionHash = async () => {
    try {
        logDebug("listenForTransactionBlockWiseTransactionHash Started");

        // await insertOrUpdateTransactionQueueForFail()
        const generalSettings = await getGeneralSettings()

        const isRoundCloseRunning = generalSettings.isRoundCloseRunning ?? 0;
        logDebug("listenForTransactionBlockWiseTransactionHash isRoundCloseRunning", isRoundCloseRunning);

        if (isRoundCloseRunning == 1) {
            // await updateFallbackCountInfo()
            logDebug("listenForTransactionBlockWiseTransactionHash Ended due to Round Close is Running");
            return
        }

        let startingBlockNumber = generalSettings.lastSyncBlockNumber ?? 0;
        // const secondsAgo = (generalSettings.fetchMinutesAgoBlock ?? 0) * ((generalSettings.fallbackSkipCount ?? 0) + 1) * 60; // 5 = days (7200 minutes)
        const maxBlockOffset = generalSettings.maxBlockOffset ?? 0;
        // const platFormAverageBlockSeconds = generalSettings.platFormAverageBlockSeconds ?? 0 // general settings

        if (startingBlockNumber > 0 && maxBlockOffset > 0) {
            logDebug("Start Processing of listenForTransactionBlockWiseTransactionHash");

            // const url = process.env.RPC_URL;
            const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
            // const provider = new ethers.providers.WebSocketProvider(url);
            const provider = getProvider();
            const contract = new ethers.Contract(lotteryAddress, lotterABI, provider);

            const latestBlockNumber = await provider.getBlockNumber();
            // const latestBlockNumber = 43229355;
            logDebug("listenForTransactionBlockWiseTransactionHash latestBlockNumber", latestBlockNumber)

            // const blockDiff = secondsAgo / platFormAverageBlockSeconds
            // const startingBlockNumber = Math.floor(latestBlockNumber - blockDiff)
            // logDebug("listenForTransactionBlockWiseTransactionHash startingBlockNumber", startingBlockNumber);

            startingBlockNumber += 1;
            logDebug("listenForTransactionBlockWiseTransactionHash startingBlockNumber", startingBlockNumber)

            const processingBlocks = Math.ceil((latestBlockNumber - startingBlockNumber) / maxBlockOffset)
            logDebug("listenForTransactionBlockWiseTransactionHash processingBlocks", processingBlocks)

            for (let blockNumber = 0; blockNumber < processingBlocks; blockNumber++) {
                let fromBlock = startingBlockNumber + (blockNumber * maxBlockOffset)
                let toBlock = fromBlock + maxBlockOffset;
                if (blockNumber > 0) {
                    fromBlock++
                }
                if (toBlock > latestBlockNumber) {
                    toBlock = latestBlockNumber
                }
                logDebug("listenForTransactionBlockWiseTransactionHash fromBlock", fromBlock);
                logDebug("listenForTransactionBlockWiseTransactionHash toBlock", toBlock);

                await getAndUpdateTransactionHashFromBlockNumber(contract, fromBlock, toBlock)
            }

            // await updateFallbackCountResetInfo()
            // logDebug("listenForTransactionBlockWiseTransactionHash updateFallbackCountResetInfo success")
        }

        logDebug("listenForTransactionBlockWiseTransactionHash Ended")
    } catch (error) {
        logError("listenForTransactionBlockWiseTransactionHash Error:", error)
    }
};

// const getAndUpdateTransactionHashFromBlockNumber = async (contract, fromBlock, toBlock) => {
//     try {
//         const eventFilter = contract.filters['Participated'];
//         const eventLogs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

//         const transactionHashes = eventLogs.map((log) => {
//             const eventInfo = log;
//             return eventInfo;
//         });

//         logDebug("getAndUpdateTransactionHashFromBlockNumber", transactionHashes);
//         // await saveTransactionQueueInfo(transactionHashes);
//     } catch (error) {
//         logError("Error in getAndUpdateTransactionHashFromBlockNumber() function:", error);
//     }
// }

const getAndUpdateTransactionHashFromBlockNumber = async (contract, fromBlock, toBlock, eventNames) => {
    try {
        let events;
        if (eventNames && eventNames.length > 0) {
            events = eventNames
        } else {
            events = ['Participated', 'PrizeClaimed', 'RoundClosed', 'MilestoneBonusReleased'];
        }
        const allResults = []

        for (const event of events) {
            const eventFilter = contract.filters[event]();
            const eventLogs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

            if (eventLogs.length > 0) {
                logDebug("getAndUpdateTransactionHashFromBlockNumber eventLogs", eventLogs);
            }
            for (const eventInfo of eventLogs) {
                // const transactionHash = eventInfo.transactionHash;
                if (eventInfo.topics.length > 0) {
                    const topicAddress = eventInfo.topics[0];
                    // const existingTransactionHash = await checkTransactionHashExists({ transactionHash });

                    // logDebug("existingTransactionHash", existingTransactionHash);
                    // if (existingTransactionHash.length === 0) {
                    if (topicAddress === process.env.PARTICIPATED_TOPICS_ADDRESS) {
                        const result = await checkAndProcessParticipatedEvent(eventInfo);
                        allResults.push(result);
                    }
                    if (topicAddress === process.env.MILESTONE_RELEASED_TOPICS_ADDRESS) {
                        const result = await checkAndProcessMilestoneBonusReleasedEvent(eventInfo);
                        allResults.push(result);
                    }
                    if (topicAddress === process.env.ROUND_CLOSED_TOPICS_ADDRESS) {
                        const result = await checkAndProcessRoundClosedEvent(eventInfo, contract);
                        allResults.push(result);
                    }
                    if (topicAddress === process.env.PRIZED_CLAIMED_TOPICS_ADDRESS) {
                        const result = await checkAndProcessPrizeClaimedEvent(eventInfo);
                        allResults.push(result);
                    }
                }
                // }
            }
        }
        if (fromBlock !== toBlock) {
            await updateLastSyncBlockNumberInfo(toBlock);
        }
        return allResults;

    } catch (error) {
        logError("Error in getAndUpdateTransactionHashFromBlockNumber() function:", error);
        return [];
    }
}

const getAndSaveTransactionInfoFromTransactionHash = async (transactionHashes) => {
    try {
        let transactionHashProcessed = [];
        const transactionHashQueue = await saveTransactionQueueInfo(transactionHashes);
        if (transactionHashQueue && transactionHashQueue.length > 0) {
            transactionHashProcessed = await getAndCalcTransactionDetailsFromTransactionQueueHash(transactionHashQueue, true);
        }
        return transactionHashProcessed
    } catch (error) {
        logError("Error in getAndSaveTransactionInfoFromTransactionHash() function:", error);
        return []
    }
};

const getAndCalcTransactionDetailsFromTransactionQueueHash = async (transactionHashes, isWaitForTransaction) => {
    try {
        let transactionHashProcessed = [];
        const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
        const participatedTopicAddress = process.env.PARTICIPATED_TOPICS_ADDRESS;
        const milestoneReleasedTopicAddress = process.env.MILESTONE_RELEASED_TOPICS_ADDRESS;
        const roundClosedTopicAddress = process.env.ROUND_CLOSED_TOPICS_ADDRESS;
        const prizedClaimedTopicAddress = process.env.PRIZED_CLAIMED_TOPICS_ADDRESS;

        for (let transactionHash of transactionHashes) {
            try {
                logDebug("getAndCalcTransactionDetailsFromTransactionQueueHash transactionHash", transactionHash)
                // const isTransactionHashExists = await checkTransactionExists(transactionHash);
                // if (!isTransactionHashExists) {
                await updateTransactionQueueForRunning(transactionHash)
                const data = await getProviderAndTransactions(transactionHash, isWaitForTransaction)
                if (data && data.provider && data.transaction) {
                    if (data.transaction.status === 1) {
                        const fromBlock = data.transaction.blockNumber;
                        logDebug("getAndCalcTransactionDetailsFromTransactionQueueHash fromBlock", fromBlock)

                        let eventNames = [];

                        const allParticipated = data.transaction.logs.filter(x => x.topics[0] === participatedTopicAddress);
                        if (allParticipated.length > 0) eventNames.push('Participated')

                        const allMilestoneReleased = data.transaction.logs.filter(x => x.topics[0] === milestoneReleasedTopicAddress);
                        if (allMilestoneReleased.length > 0) eventNames.push('MilestoneBonusReleased')

                        const allRoundClosed = data.transaction.logs.filter(x => x.topics[0] === roundClosedTopicAddress);
                        if (allRoundClosed.length > 0) eventNames.push('RoundClosed')

                        const allPrizedClaimed = data.transaction.logs.filter(x => x.topics[0] === prizedClaimedTopicAddress);
                        if (allPrizedClaimed.length > 0) eventNames.push('PrizeClaimed')

                        logDebug("getAndCalcTransactionDetailsFromTransactionQueueHash eventNames", eventNames)

                        if (eventNames.length > 0) {
                            const provider = data.provider;
                            const contract = new ethers.Contract(lotteryAddress, lotterABI, provider);

                            const allResults = await getAndUpdateTransactionHashFromBlockNumber(contract, fromBlock, fromBlock, eventNames);

                            let errorMessage = '';
                            for (let result of allResults) {
                                if (!result.success && result.message) {
                                    errorMessage += ` ${result.eventType} Error: ${result.message}`
                                }
                            }
                            if (errorMessage) {
                                await updateTransactionQueueForFail(transactionHash, errorMessage)
                            } else {
                                await updateTransactionQueueForSuccess(transactionHash)
                                transactionHashProcessed.push(transactionHash)
                            }
                        } else {
                            await updateTransactionQueueForFail(transactionHash, "No Matching Topics Found in Log");
                        }
                    } else {
                        await updateTransactionQueueForFail(transactionHash, "Failed transaction status return from chain.");
                    }
                }
                else {
                    if (data && data.message) {
                        logDebug("getAndCalcTransactionDetailsFromTransactionQueueHash data.message:", data.message);
                        // await updateTransactionQueueForFail(transactionHash, `error : ${data.message}`)
                        if (data.message.toLowerCase().includes('timeout')) {
                            await updateTransactionQueueErrorMessage(transactionHash, `error : ${data.message}`);
                        } else {
                            await updateTransactionQueueForFail(transactionHash, `error : ${data.message}`);
                        }
                    } else if (data && !data.provider) {
                        await updateTransactionQueueForFail(transactionHash, 'error : provider not found.')
                    } else if (data && !data.transaction) {
                        await updateTransactionQueueForFail(transactionHash, 'error : transaction not found.')
                    } else {
                        await updateTransactionQueueForFail(transactionHash, `error : provider or transaction not found.`)
                    }
                }
                // } else {
                // await updateTransactionQueueForSuccess(transactionHash)
                // }
            } catch (errorHash) {
                logError("Error in transactionHash getAndCalcTransactionDetailsFromTransactionQueueHash() function:", `${transactionHash} ${errorHash}`);
                await updateTransactionQueueForFail(transactionHash, errorHash)
            }
        }
        return transactionHashProcessed;
    } catch (error) {
        logError("Error in getAndCalcTransactionDetailsFromTransactionQueueHash() function:", error);
        return [];
    }
};

const getProviderAndTransactions = async (transactionHash, isWaitForTransaction) => {
    logDebug(`getProviderAndTransactions transactionHash`, transactionHash);
    try {
        const provider = getProvider();
        // logDebug(`provider:`, provider);
        let transaction;
        if (isWaitForTransaction) {
            const timeOut = TRANSACTION_TIMEOUT_SECONDS * 1000 // 5 minutes
            transaction = await provider.waitForTransaction(transactionHash, 1, timeOut);
            logDebug("getProviderAndTransactions waitForTransaction transaction", transaction)
        } else {
            transaction = await provider.getTransactionReceipt(transactionHash);
            logDebug("getProviderAndTransactions getTransactionReceipt transaction", transaction);
        }
        return { provider, transaction, message: null }
    } catch (error) {
        logError("Error in getProviderAndTransactions() function:", error);
        // if (error.code === 'TIMEOUT') {
        return { provider: null, transaction: null, message: `${error} ` }
        // }
    }
}

const processRunningTransactionsUpdateStatus = async () => {
    try {
        logDebug("processRunningTransactionsUpdateStatus started");
        const transactionHashes = await findRunningTransactionsUpdateStatus();
        logDebug("processRunningTransactionsUpdateStatus transactionHashes", transactionHashes)

        if (transactionHashes && transactionHashes.length > 0) {
            await getAndCalcTransactionDetailsFromTransactionQueueHash(transactionHashes, false);
            await updateRunningTransactionsToFailAfterThresholdExceed();
        }
        logDebug("processRunningTransactionsUpdateStatus ended");
    } catch (error) {
        logError("Error in processRunningTransactionsUpdateStatus() function:", error);
    }
};

// processRunningTransactionsUpdateStatus();
// listenForTransactionBlockWiseTransactionHash();

module.exports = {
    listenForTransactionBlockWiseTransactionHash,
    getAndCalcTransactionDetailsFromTransactionQueueHash,
    getAndSaveTransactionInfoFromTransactionHash,
    getProviderAndTransactions,
    processRunningTransactionsUpdateStatus
}