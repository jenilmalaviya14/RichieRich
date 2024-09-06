const decimals = process.env.DECIMALS;

const convertBigAmountToSmallAmount = (entryFee) => {
    if(entryFee){
        return (Number(entryFee) / Number(BigInt(10 ** decimals)));
    }
    return 0;
};

module.exports = {
    convertBigAmountToSmallAmount
}