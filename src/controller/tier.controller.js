const { getTicketListInfo, getWinnerInfo, getMilestoneBonusWinnerInfo, getTierAndTicketWiseInfo, getClaimableTicketsFromTicketInfo } = require('../services/database-services/tier-db.service');
const { logDebug, logError } = require('../services/common-services/log-common.service')

// const createTier = async (req, res) => {
//     try {
//         const { tierId, roundNo, ticketNo, participantAddress, referralAddress } = req.body;

//         if (!req.body) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing required fields."
//             });
//         }
//         const result = await insertTierInfo({
//             tierId,
//             roundNo,
//             ticketNo,
//             participantAddress,
//             referralAddress
//         });

//         if (result) {
//             res.status(201).json({
//                 success: true,
//                 message: "Tier created successfully.",
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 message: "Failed to create tier information."
//             });
//         }
//     } catch (error) {
//         console.error("Error in createTier() function:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

// const updateWinningTier = async (req, res) => {
//     try {
//         const { tierId, roundNo, ticketNo, winningPosition } = req.body;

//         if (!req.body) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing required fields."
//             });
//         }

//         const result = await updateRoundCloseInfo({
//             tierId,
//             roundNo,
//             ticketNo,
//             winningPosition
//         });

//         if (result) {
//             res.status(200).json({
//                 success: true,
//                 message: "Tier updated successfully.",
//             });
//         } else {
//             res.status(500).json({
//                 success: false,
//                 message: "Failed to update tier information."
//             });
//         }
//     } catch (error) {
//         console.error("Error in updateWinningTier() function:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

// const updateClaimTier = async (req, res) => {
//     try {
//         const { tierId, roundNo, ticketNo, claimStatus } = req.body;

//         if (!req.body) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing required fields."
//             });
//         }

//         const result = await updatePrizeClaimInfo({
//             tierId,
//             roundNo,
//             ticketNo,
//             claimStatus
//         });

//         if (result) {
//             res.status(200).json({
//                 success: true,
//                 message: "Tier updated successfully.",
//             });
//         }
//     } catch (error) {
//         console.error("Error in updateClaimTier() function:", error);
//         res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

const getTicketList = async (req, res) => {
    try {
        const { tierId, roundNo, participantAddress } = req.body;

        if (tierId === undefined || tierId === "" || tierId === null ||
            roundNo === undefined || roundNo === "" || roundNo === null ||
            participantAddress === undefined || participantAddress === "" || participantAddress === null) {
            return res.status(200).json({
                success: true,
                message: "tierId, roundNo, and participantAddress are required.",
                data: []
            });
        }

        const result = await getTicketListInfo(tierId, roundNo, participantAddress);

        if (result && result.length > 0) {
            res.status(200).json({
                success: true,
                message: "Ticket data has been fetched Successfully.",
                data: result
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No ticket information found.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in getTicketList() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getWinnerList = async (req, res) => {
    try {
        const { tierId, roundNo } = req.body;

        if (tierId === undefined || tierId === "" || tierId === null ||
            roundNo === undefined || roundNo === "" || roundNo === null) {
            return res.status(200).json({
                success: true,
                message: "tierId and roundNo are required.",
                data: []
            });
        }

        const result = await getWinnerInfo(tierId, roundNo);
        if (result) {
            res.status(200).json({
                success: true,
                message: "Winner data has been fetched Successfully.",
                data: result
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Winner information found.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in getWinnerList() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getMilestoneBonusWinner = async (req, res) => {
    try {
        const { tierId, roundNo } = req.body;

        if (tierId === undefined || tierId === "" || tierId === null ||
            roundNo === undefined || roundNo === "" || roundNo === null) {
            return res.status(200).json({
                success: true,
                message: "tierId and roundNo are required.",
                data: {}
            });
        }

        const result = await getMilestoneBonusWinnerInfo(tierId, roundNo);

        if (result) {
            res.status(200).json({
                success: true,
                message: "Milestone bonus winners fetched successfully.",
                data: result
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No milestone bonus winners found.",
                data: {}
            });
        }
    } catch (error) {
        logError("Error in getMilestoneBonusWinner() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getTierAndTicketWiseList = async (req, res) => {
    try {
        const { tierId, tickets } = req.body;

        if (!tierId || !Array.isArray(tickets)) {
            return res.status(400).json({
                success: false,
                message: "Invalid Request."
            });
        }

        const result = await getTierAndTicketWiseInfo(tierId, tickets);

        if (result) {
            res.status(200).json({
                success: true,
                message: "Ticket data has been fetched successfully.",
                data: result
            });
        }
    } catch (error) {
        console.error("Error in getTicketsByTierAndNumbers() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getClaimableAmountFromTicket = async (req, res) => {
    try {
        const { tierId, roundNo, participantAddress } = req.body;

        if (tierId === undefined || tierId === "" || tierId === null ||
            roundNo === undefined || roundNo === "" || roundNo === null ||
            participantAddress === undefined || participantAddress === "" || participantAddress === null) {
            return res.status(200).json({
                success: true,
                message: "tierId, roundNo, and participantAddress are required.",
                data: {
                    claimableAmount: 0,
                    claimabletickets: []
                }
            });
        }

        const claimableTicketListInfo = await getClaimableTicketsFromTicketInfo(tierId, roundNo, participantAddress);
        const [[claimableAmountInfo]] = claimableTicketListInfo
        const claimabletickets = claimableTicketListInfo[1].map(x => x.ticketNo)

        res.status(200).json({
            success: true,
            message: "Ticket data has been fetched Successfully.",
            data: {
                claimableAmount: claimableAmountInfo.claimableAmount ?? 0,
                claimabletickets
            }
        });
    } catch (error) {
        logError("Error in getClaimableAmountFromTicket() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    getTicketList,
    getWinnerList,
    getMilestoneBonusWinner,
    getTierAndTicketWiseList,
    getClaimableAmountFromTicket
};