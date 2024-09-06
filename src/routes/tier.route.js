const express = require('express');
const router = express.Router();
const tierController = require("../controller/tier.controller");

// router.post(
//     "/tier/create-tier",
//     tierController.createTier
// );

// router.post(
//     "/tier/update-winning",
//     tierController.updateWinningTier
// );

// router.post(
//     "/tier/update-claim",
//     tierController.updateClaimTier
// );

router.post(
    "/tier/ticket-info",
    tierController.getTicketList
);

router.post(
    "/tier/winner-info",
    tierController.getWinnerList
);

router.post(
    "/tier/milestone-bonus-winner",
    tierController.getMilestoneBonusWinner
);

router.post(
    "/tier/tier-ticket-list",
    tierController.getTierAndTicketWiseList
);

router.post(
    "/tier/ticket-claimable-info",
    tierController.getClaimableAmountFromTicket
);

module.exports = router;