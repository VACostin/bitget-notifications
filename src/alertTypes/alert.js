const discordBot = require("./discordBot");

const Alert = (description, nrOfCandles, fnCheckPattern) => {
  let isTriggered = false;
  let ts = 0;

  const getSlice = (rawData) => rawData.slice(-nrOfCandles);

  const updateStatusAndTimestamp = (lastCandle) => {
    const { ts: newTs } = lastCandle;
    if (ts !== newTs) {
      isTriggered = false;
      ts = newTs;
    }
  };

  const sendNotification = async (status) => {
    if (isTriggered) return;
    isTriggered = true;
    const { symbol, timeframe } = description;
    const alertObject = { symbol, timeframe, status };
    discordBot.sendAlert(alertObject);
  };

  const evaluateAndNotify = async (rawData) => {
    const candles = getSlice(rawData);
    const lastCandle = candles.slice(-1);
    updateStatusAndTimestamp(lastCandle);
    const status = fnCheckPattern(candles, description);
    if (status) await sendNotification(status);
  };
  return { evaluateAndNotify };
};

module.exports = Alert;
