DELIMITER $ $ CREATE PROCEDURE `get_ticket_info`(
    IN `p_tierId` INT,
    IN `p_roundNo` INT,
    IN `p_participantAddress` VARCHAR(255)
) BEGIN
SELECT
    *
FROM
    buy_ticket_list btl
WHERE
    (
        p_tierId IS NULL
        OR p_tierId = ''
        OR FIND_IN_SET(btl.tierId, p_tierId) > 0
    )
    AND (
        p_roundNo IS NULL
        OR p_roundNo = ''
        OR btl.roundNo = p_roundNo
    )
    AND (
        p_participantAddress IS NULL
        OR p_participantAddress = ''
        OR btl.participantAddress = p_participantAddress
    )
ORDER BY
    btl.tierId DESC;

END $ $ CREATE PROCEDURE `get_winner_info`(
    IN `p_tierId` INT,
    IN `p_roundNo` INT
) BEGIN
SELECT
    *
FROM
    buy_ticket_list btl
WHERE
    (
        p_tierId IS NULL
        OR p_tierId = ''
        OR FIND_IN_SET(btl.tierId, p_tierId) > 0
    )
    AND (
        p_roundNo IS NULL
        OR p_roundNo = ''
        OR btl.roundNo = p_roundNo
    )
ORDER BY
    btl.winningPosition,
    btl.tierId ASC;

END $ $ CREATE PROCEDURE `get_claimable_tickets`(
    IN `p_tierId` INT,
    IN `p_roundNo` INT,
    IN `p_participantAddress` VARCHAR(255)
) BEGIN
SELECT
    SUM(prizeAmount) AS claimableAmount
FROM
    buy_ticket_list
WHERE
    tierId = p_tierId
    AND roundNo = p_roundNo
    AND participantAddress = p_participantAddress
    AND claimStatus = 0
    AND winningPosition IN (1, 2, 3);

SELECT
    ticketNo
FROM
    buy_ticket_list
WHERE
    tierId = p_tierId
    AND roundNo = p_roundNo
    AND participantAddress = p_participantAddress
    AND claimStatus = 0
    AND winningPosition IN (1, 2, 3)
ORDER BY
    ticketNo;

END $ $ CREATE PROCEDURE `insert_round_wise_blocknumber`(
    IN `p_tierId` BIGINT,
    IN `p_roundNo` BIGINT,
    IN `p_blockNumber` BIGINT
) BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        round_wise_blocknumber
    WHERE
        tierId = p_tierId
        AND roundNo = p_roundNo
) THEN
INSERT INTO
    round_wise_blocknumber (tierId, roundNo, fromBlockNumber)
VALUES
    (p_tierId, p_roundNo, p_blockNumber);

END IF;

END $ $ CREATE PROCEDURE `insert_ticket_info`(
    IN `p_tierId` BIGINT,
    IN `p_roundNo` BIGINT
) BEGIN
INSERT INTO
    buy_ticket_list (tierId, roundNo, ticketNo, participatedOn)
SELECT
    a.tierId,
    a.roundNo,
    a.ticketNo,
    UTC_TIMESTAMP()
FROM
    (
        SELECT
            tierId,
            roundNo,
            ticketNo - 1 as ticketNo
        FROM
            buy_ticket_list
        WHERE
            tierId = p_tierId
            AND roundNo = p_roundNo
        UNION
        SELECT
            tierId,
            roundNo,
            ticketNo
        FROM
            buy_ticket_list
        WHERE
            tierId = p_tierId
            AND roundNo = p_roundNo
        UNION
        SELECT
            tierId,
            roundNo,
            ticketNo + 1 as ticketNo
        FROM
            buy_ticket_list
        WHERE
            tierId = p_tierId
            AND roundNo = p_roundNo
    ) AS a
    LEFT JOIN (
        SELECT
            tierId,
            roundNo,
            ticketNo
        FROM
            buy_ticket_list
        WHERE
            tierId = p_tierId
            AND roundNo = p_roundNo
    ) AS b ON a.tierId = b.tierId
    AND a.roundNo = b.roundNo
    AND (a.ticketNo = b.ticketNo)
    LEFT JOIN buy_ticket_list c ON a.tierId = c.tierId
    AND a.ticketNo = c.ticketNo
WHERE
    b.ticketNo IS null
    AND c.ticketNo IS null
    AND a.ticketNo > ((p_roundNo - 1) * 5000)
    AND a.ticketNo <= (p_roundNo * 5000)
ORDER BY
    a.ticketNo;

END
ORDER BY
    a.ticketNo;

DELIMITER;