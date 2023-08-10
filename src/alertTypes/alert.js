const path = require("path");
const discordBot = require("./discordBot");

const Alert = (
  description,
  nrOfCandles,
  fnCheckPattern,
  fnGenerateImage = null
) => {
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

  const sendNotification = (status, imagePath = null) => {
    isTriggered = true;
    const { name, symbol, timeframe } = description;
    const alertObject = { channelName: name, symbol, timeframe, status };
    discordBot.sendAlert(alertObject, imagePath);
  };

  const getImagePath = async (rawData) => {
    const { name, symbol, timeframe } = description;
    const nameTrimmed = name.replace(/\s/g, '');
    const imageName = `/${nameTrimmed}${symbol}${timeframe}.png`;
    const imagePath = path.join(__dirname, `/chartPNGs${imageName}`);
    await fnGenerateImage(rawData, imagePath);
    return imagePath;
  };

  const evaluateAndNotify = async (rawData) => {
    const candles = getSlice(rawData);
    const lastCandle = candles.slice(-1);
    updateStatusAndTimestamp(lastCandle);
    const status = fnCheckPattern(candles, description);
    if (status && !isTriggered)
      if (fnGenerateImage) {
        const {symbol, timeframe} = description;
        const title = `${symbol}_${timeframe}`
        const imagePath = await getImagePath(rawData, title);
        sendNotification(status, imagePath);
      }
      else
        sendNotification(status)
  };
  return { evaluateAndNotify };
};

module.exports = Alert;
