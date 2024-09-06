const ethers = require("ethers");
const lotterABI = require("../../abi/lotter.abi.json");
const { processAndSavePrizeClaimedEvent, processAndSaveRoundClosedEvent, processAndSaveMilestoneBonusReleasedEvent } = require("./process-lottery-event-common.service");
const { checkAndProcessParticipatedEvent } = require("./process-lottery-event-common.service");
const { logDebug, logError } = require('./log-common.service')
const { getProvider } = require('./provider-common.service')
const { startTransactionQueueProcess } = require('./transaction-queue-common.service')

const listenForParticipatedInfo = async () => {
    try {
        // const url = process.env.RPC_URL;
        const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
        // const provider = new ethers.providers.WebSocketProvider(url);
        const provider = getProvider();
        const contract = new ethers.Contract(lotteryAddress, lotterABI, provider);
        // contract.on("Participated", async (userAddress, tier, roundId, ticketId, entryFee, refferedBy, refferalBonus, participateTime) => {
        //     // logDebug("listenForParticipatedInfo event", event);
        // logDebug("listenForParticipatedInfo entryFee", entryFee);
        // const convertedEntryFee = convertBigAmountToSmallAmount(entryFee);
        //     logDebug("listenForParticipatedInfo convertedEntryFee", convertedEntryFee);

        //     let ParticipateData = {
        //         tierId: tier,
        //         roundNo: roundId,
        //         ticketNo: ticketId,
        //         participantAddress: userAddress,
        //         entryFee: convertedEntryFee,
        //         referralAddress: refferedBy,
        //         refferalBonus: refferalBonus
        //     };
        //     // await insertParticipatedInfo(ParticipateData);
        //     logDebug("listenForParticipatedInfo ParticipateData", ParticipateData);
        // })

        contract.on('Participated', async (...args) => {
            // for (let index = 0; index < args.length; index++) {
            //     console.log(args[index]);
            // }
            const eventInfo = args[args.length - 1];
            logDebug("listenForParticipatedInfo eventInfo", eventInfo);
            await checkAndProcessParticipatedEvent(eventInfo)
        });
    } catch (error) {
        logError("Error in listenForParticipatedInfo() function:", error);
    }
};

const listenForPrizeClaimedInfo = async () => {
    try {
        // const url = process.env.RPC_URL;
        const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
        // const provider = new ethers.providers.WebSocketProvider(url);
        const provider = getProvider();
        const contract = new ethers.Contract(lotteryAddress, lotterABI, provider);

        contract.on("PrizeClaimed", async (...args) => {
            const eventInfo = args[args.length - 1];
            logDebug("listenForPrizeClaimedInfo eventInfo", eventInfo);

            await processAndSavePrizeClaimedEvent(eventInfo);
        })
    } catch (error) {
        logError("Error in listenForPrizeClaimedInfo() function:", error);
    }
};

const listenForRoundClosedInfo = async () => {
    try {
        // const url = process.env.RPC_URL;
        const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
        // const provider = new ethers.providers.WebSocketProvider(url);
        const provider = getProvider();
        const contract = new ethers.Contract(lotteryAddress, lotterABI, provider);

        contract.on("RoundClosed", async (...args) => {

            const eventInfo = args[args.length - 1];
            logDebug("listenForRoundClosedInfo eventInfo", eventInfo);

            await processAndSaveRoundClosedEvent(eventInfo, contract);
        });
    } catch (error) {
        logError("Error in listenForRoundClosedInfo() function:", error);
    }
};

const listenForMilestoneBonusReleasedInfo = async () => {
    try {
        // const url = process.env.RPC_URL;
        const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
        // const provider = new ethers.providers.WebSocketProvider(url);
        const provider = getProvider();
        const contract = new ethers.Contract(lotteryAddress, lotterABI, provider);

        contract.on("MilestoneBonusReleased", async (...args) => {

            const eventInfo = args[args.length - 1];
            logDebug("listenForMilestoneBonusReleasedInfo eventInfo", eventInfo);

            await processAndSaveMilestoneBonusReleasedEvent(eventInfo);
        })
    } catch (error) {
        logError("Error in listenForMilestoneBonusReleasedInfo() function:", error);
    }
};

// const testing = async () => {
//     try {
//         const url = process.env.RPC_URL;
//         const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
//         const provider = new ethers.providers.WebSocketProvider(url);
//         const provider = getProvider();
//         const contract = new ethers.Contract(lotteryAddress, lotterABI, provider);

//         const eventInfo = { transactionHash: "0x36011dd2159158c18b790a4806a66903b65dae7396e6e4501472f5af32e95428", args: { tier: 1, roundId: 1 } }

//         await processAndSaveRoundClosedEvent(eventInfo, contract);
//     } catch (error) {

//     }
// }

const startListen = async () => {
    try {
        // await testing()
        // await temp()
        // await listenForParticipatedInfo();
        // await listenForPrizeClaimedInfo();
        // await listenForRoundClosedInfo();
        // await listenForMilestoneBonusReleasedInfo();
        // await startTransactionQueueProcess();
    } catch (error) {
        logError("Error in startListen() function:", error);
    }
}

// startListen();

// const listenForprizeDetailsInfo = async () => {
//     try {
//         const url = process.env.RPC_URL;
//         const lotteryAddress = process.env.LOTTERY_CONTRACT_ADDRESS;
//         const provider = new ethers.providers.WebSocketProvider(url);
//         const provider = getProvider();
//         const contract = new ethers.Contract(lotteryAddress, lotterABI, provider);

//         // const prizeDetails = await contract.getPrizeMoney(1);
//         // logDebug("prizeDetails", prizeDetails)
//         // const converted1EntryFee = convertBigAmountToSmallAmount(prizeDetails.fPrizeAmount);
//         // const converted2EntryFee = convertBigAmountToSmallAmount(prizeDetails.sPrizeAmount);
//         // const converted3EntryFee = convertBigAmountToSmallAmount(prizeDetails.tPrizeAmount);
//         // logDebug("fPrizeAmount", converted1EntryFee)
//         // logDebug("sPrizeAmount", converted2EntryFee)
//         // logDebug("tPrizeAmount", converted3EntryFee)

//         const latestBlockNumber = await provider.getBlockNumber();
//         logDebug("latestBlockNumber", latestBlockNumber)

//     } catch (error) {
//         logError("Error in listenForprizeDetailsInfo() function:", error);
//     }
// };

// listenForprizeDetailsInfo()