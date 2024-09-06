const ethers = require("ethers");

const getProvider = () => {
    const connectorType = process.env.RPC_CONNECTOR_TYPE;
    let url;
    let provider;

    if (connectorType === 'wss') {
        url = process.env.RPC_WEBSOCKET_URL;
        provider = new ethers.providers.WebSocketProvider(url);
    } else {
        url = process.env.RPC_HTTPS_URL;
        provider = new ethers.providers.JsonRpcProvider(url);
    }

    return provider;
};

module.exports = { getProvider }