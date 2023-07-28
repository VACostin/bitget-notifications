const Alert = require("./alert");

const CHANGE = parseFloat(process.env.CANDLE_PATTERN_CHANGE);
const NR_OF_CANDLES = 4;

const changeIsLowerThanBaseline = (valueString1, valueString2) => {
  const value1 = parseFloat(valueString1);
  const value2 = parseFloat(valueString2);
  return Math.abs(((value1 - value2) / value1) * 100) <= CHANGE;
};

const checkGreenRedGreenRed = (candles) => {
  const firstCandle = candles[0];
  const secondCandle = candles[1];
  const thirdCandle = candles[2];
  const fourthCandle = candles[3];
  return (
    changeIsLowerThanBaseline(firstCandle.close, secondCandle.open) &&
    changeIsLowerThanBaseline(thirdCandle.close, secondCandle.open) &&
    changeIsLowerThanBaseline(fourthCandle.open, thirdCandle.close)
  );
};

const checkRedGreenRedGreen = (candles) => {
  const firstCandle = candles[0];
  const secondCandle = candles[1];
  const thirdCandle = candles[2];
  const fourthCandle = candles[3];
  return (
    changeIsLowerThanBaseline(firstCandle.close, secondCandle.open) &&
    changeIsLowerThanBaseline(thirdCandle.close, secondCandle.open) &&
    changeIsLowerThanBaseline(fourthCandle.open, thirdCandle.close)
  );
};

const colorMatchesFlag = (candle, isGreenFlag) => {
  const openString = candle.open;
  const closeString = candle.close;
  const open = parseFloat(openString);
  const close = parseFloat(closeString);
  const difference = close - open;
  if (isGreenFlag) return difference >= 0;
  return difference <= 0;
};

const isAlternating = (candles, firstFlag) => {
  let flag = firstFlag;
  for (let i = 0; i < candles.length; i += 1) {
    const candle = candles[i];
    if (colorMatchesFlag(candle, flag)) flag = !flag;
    else return false;
  }
  return true;
};

const checkPattern = (candles, name) => {
  if (candles.length < NR_OF_CANDLES) {
    if (candles.length <= 0) console.log(`Couldn't get any data for ${name}`);
    else
      console.log(
        `Not enough data for ${name}. Expected ${NR_OF_CANDLES} received ${candles.length}.\nConsider adding it to exceptions untill there are enough datapoints`
      );
  } else {
    if (isAlternating(candles, 1) && checkGreenRedGreenRed(candles))
      return `${name}: G_R_G_R Pattern`
    if (isAlternating(candles, 0) && checkRedGreenRedGreen(candles))
      return `${name}: R_G_R_G Pattern`
  }
  return false;
};

const CandlePattern = (pair) => {
  const { symbol, timeframe } = pair;
  const name = `CandlePattern${symbol}${timeframe}`;
  const alert = Alert(name, NR_OF_CANDLES, checkPattern);
  const { evaluateAndNotify } = alert;
  return { NR_OF_CANDLES, evaluateAndNotify };
};

module.exports = { CandlePattern };
