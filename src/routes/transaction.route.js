const express = require('express');
const router = express.Router();
const transactionController = require("../controller/transaction.controller");

router.post(
    "/transaction/transaction-hash",
    transactionController.saveTransactionHashInQueue
);

router.post(
    "/transaction/transaction-hash-log-info",
    transactionController.transactionHashLogInfo
);

router.post(
    "/transaction/transaction-queue",
    transactionController.saveTransactionInfoFromTransactionHash
);

module.exports = router;