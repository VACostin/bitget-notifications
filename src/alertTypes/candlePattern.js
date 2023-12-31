/* eslint-disable no-underscore-dangle */
const Alert = require("./alert");
const generateImage = require("./chartPNGs");


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

const checkPattern = (candles, description) => {
  if (candles.length < NR_OF_CANDLES) {
    if (candles.length <= 0)
      console.log(
        `Couldn't get any data for ${description.symbol} ${description.timeframe}`
      );
    /* else
      console.log(
        `Not enough data for ${description.symbol} ${description.timeframe}. Expected ${NR_OF_CANDLES} received ${candles.length}.\nConsider adding it to exceptions untill there are enough datapoints`
      ); */
  } else {
    if (isAlternating(candles, 1) && checkGreenRedGreenRed(candles))
      return `Green first`;
    if (isAlternating(candles, 0) && checkRedGreenRedGreen(candles))
      return `Red first`;
  }
  return false;
};

const _generateImage = async (rawData, imagePath, title) => {
  const chartLength = 8;
  const chartData = rawData.slice(-chartLength);
  await generateImage(chartData, imagePath, title);
} 

const CandlePattern = (pair) => {
  const { symbol, timeframe } = pair;
  const name = `Candle Pattern`;
  const description = {
    name,
    symbol,
    timeframe,
  };
  const alert = Alert(description, NR_OF_CANDLES, checkPattern, _generateImage);
  const { evaluateAndNotify } = alert;
  return { NR_OF_CANDLES, evaluateAndNotify };
};

module.exports = { CandlePattern };
