const BOT_URL = process.env;
const BOT_TOKEN = process.env;

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
    const Authorization = `Bearer ${BOT_TOKEN}`;
    const Connection = "keep-alive";
    const ContentType = "application/json";
    fetch(BOT_URL, {
      method: "POST",
      body: JSON.stringify(alertObject),
      headers: {
        Authorization,
        "Content-type": ContentType,
        Connection,
      },
    });
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
