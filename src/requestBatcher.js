const { CandlePattern, FisherTransform } = require("./alertTypes");
const { Read } = require("./driver");

const REQUESTS_PER_INTERVAL = parseInt(process.env.REQUESTS_PER_INTERVAL, 10);
const LIMIT = Math.min(
  Math.max(4, parseInt(process.env.CANDLES_PER_REQUEST, 10) + 1),
  100
);

const getPairs = () => {
  const symbolsString = process.env.SYMBOLS_SPOT;
  const timeframesString = process.env.TIMEFRAMES;
  const symbols = symbolsString.split(", ").map((symbol) => `${symbol}_SPBL`);
  const timeframes = timeframesString.split(", ");
  const pairs = [];
  symbols.forEach((symbol) => {
    timeframes.forEach((timeframe) => {
      pairs.push({
        symbol,
        timeframe,
      });
    });
  });
  return pairs;
};

const getAlertGroups = (pairs) => {
  const alertGroups = [];
  pairs.forEach((pair) => {
    const { symbol, timeframe } = pair;
    const symbolFormated = symbol.slice(0, -"_SPBL".length);
    const pairFormated = {
      symbol: symbolFormated,
      timeframe,
    };
    const alert1 = CandlePattern(pairFormated);
    const alert2 = FisherTransform(pairFormated);
    const alertGroup = [alert1, alert2];
    alertGroups.push(alertGroup);
  });
  return alertGroups;
};

const getBatch = (array, offset) => {
  const batch = [];
  const indexLog = [];
  for (
    let i = offset;
    batch.length < REQUESTS_PER_INTERVAL && !indexLog.includes(i);
    i += 1
  ) {
    if (i >= array.length) {
      i = 0;
    }
    batch.push(array[i]);
    indexLog.push(i);
  }
  return batch;
};

const getDataArray = async (pairsBatch) => {
  const promiseArray = [];
  pairsBatch.forEach((pair) => {
    const promise = Read(pair, LIMIT);
    promiseArray.push(promise);
  });
  try {
    const results = await Promise.all(promiseArray);
    results.forEach((result) => {
      if (result.msg !== "success") console.log(result.msg);
    });
    const rawDataArray = results.map((result) => result.data);
    return rawDataArray;
  } catch (error) {
    console.error(error);
    return 0;
  }
};

const getNewOffset = (offset, pairsLength) =>
  (offset + REQUESTS_PER_INTERVAL) % pairsLength;

const RequestBatcher = (() => {
  const pairs = getPairs();
  const pairsLength = pairs.length;
  let offset = 0;
  const alertGroups = getAlertGroups(pairs);
  const run = async () => {
    const alertGroupsBatch = getBatch(alertGroups, offset);
    const pairsBatch = getBatch(pairs, offset);
    const rawDataArray = await getDataArray(pairsBatch);
    if (rawDataArray)
      for (let i = 0; i < rawDataArray.length; i += 1) {
        const rawData = rawDataArray[i];
        const alertGroup = alertGroupsBatch[i];
        alertGroup.forEach((alert) => alert.evaluateAndNotify(rawData));
      }
    offset = getNewOffset(offset, pairsLength);
  };
  return { run };
})();

module.exports = RequestBatcher;
