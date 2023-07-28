const Client = require("./client");

const Read = (pair, limit) => {
  const { symbol, timeframe } = pair;
  const response = Client.getCandles(symbol, timeframe, { limit });
  return response;
};

module.exports = Read;
