-- Table structure for buy_ticket_list
CREATE TABLE `buy_ticket_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tierId` int(11) NOT NULL,
  `roundNo` int(11) NOT NULL,
  `ticketNo` int(11) NOT NULL,
  `entryFee` double(20, 8) NOT NULL DEFAULT 0.00000000,
  `participantAddress` varchar(250) DEFAULT NULL,
  `participatedTxHash` varchar(250) NOT NULL,
  `referralAddress` varchar(250) DEFAULT NULL,
  `refferalBonus` double(20, 8) DEFAULT 0.00000000,
  `participatedOn` datetime DEFAULT NULL,
  `winningPosition` int(11) DEFAULT NULL,
  `roundClosedTxHash` varchar(250) DEFAULT NULL,
  `winnerDeclaredOn` datetime DEFAULT NULL,
  `prizeAmount` double(20, 8) DEFAULT 0.00000000,
  `claimStatus` int(11) DEFAULT 0,
  `prizeClaimedTxHash` varchar(250) DEFAULT NULL,
  `prizeClaimedOn` datetime DEFAULT NULL,
  `isMilestoneWinner` int(11) DEFAULT 0,
  `milestoneWonAmount` double(20, 8) DEFAULT 0.00000000,
  `milestoneReleasedTxHash` varchar(250) DEFAULT NULL,
  `milestoneReleasedOn` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Table structure for general_setting
CREATE TABLE `general_setting` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fetchMinutesAgoBlock` int(11) DEFAULT 0,
  `maxBlockOffset` int(11) DEFAULT 0,
  `platFormAverageBlockSeconds` decimal(10, 3) DEFAULT 0.000,
  `isRoundCloseRunning` int(11) DEFAULT 0,
  `fallbackSkipCount` int(11) DEFAULT 0,
  `lastSyncBlockNumber` bigint(20) DEFAULT 0,
  `queueProcessCount` int(11) DEFAULT 0,
  `queueWaitSeconds` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Insert data into general_setting
INSERT INTO
  `general_setting` (
    `id`,
    `fetchMinutesAgoBlock`,
    `maxBlockOffset`,
    `platFormAverageBlockSeconds`,
    `isRoundCloseRunning`,
    `fallbackSkipCount`,
    `lastSyncBlockNumber`,
    `queueProcessCount`,
    `queueWaitSeconds`
  )
VALUES
  (1, 780, 500, 3.330, 0, 0, 0, 5, 60);

  CREATE TABLE `tier_master` (
  `id` int(11) NOT NULL,
  `tierId` int(11) NOT NULL,
  `tierName` varchar(50) NOT NULL,
  `entryFee` double(20,8) NOT NULL DEFAULT 0.00000000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tier_master`
--

INSERT INTO `tier_master` (`id`, `tierId`, `tierName`, `entryFee`) VALUES
(1, 1, 'Jessica Rabbit Tier', 50.00000000),
(2, 2, 'Rich Uncle Pennybags Tier', 100.00000000),
(3, 3, 'Scrooge McDuck Tier', 300.00000000),
(4, 4, 'Mr. Burns Tier', 500.00000000),
(5, 5, 'Richie Rich Tier', 1000.00000000);

CREATE TABLE `round_wise_blocknumber` (
  `id` int(11) NOT NULL,
  `tierId` int(11) NOT NULL,
  `roundNo` int(11) NOT NULL,
  `fromBlockNumber` bigint(20) DEFAULT 0,
  `toBlockNumber` bigint(20) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- Table structure for transaction_queue
CREATE TABLE `transaction_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transactionHash` varchar(250) NOT NULL,
  `status` varchar(50) NOT NULL,
  `errorMessage` varchar(1000) DEFAULT NULL,
  `createdOn` datetime DEFAULT NULL,
  `startedOn`datetime DEFAULT NULL,
  `endedOn` datetime DEFAULT NULL,
  `recreatedOn` datetime DEFAULT NULL,
  `failedCount` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;