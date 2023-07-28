const Alert = require("./alert");
const { fisherArray } = require("./misc");

const FISHER_TRANSFORM_LOOKBACK_PERIOD = parseInt(
  process.env.FISHER_TRANSFORM_LOOKBACK_PERIOD,
  10
);
const CANDLES_PER_REQUEST = parseInt(process.env.CANDLES_PER_REQUEST, 10);
const {
  lowExtreme: LOW_EXTREME,
  highExtreme: HIGH_EXTREME,
  inflexionPoints: INFLEXION_POINTS,
  hasZero: HAS_ZERO,
} = fisherArray;

const checkInflexionPoint = (fisherTransformedValues, inflexionPoint) => {
  const { length } = fisherTransformedValues;
  const multiplier = inflexionPoint > 0 ? 1 : -1;
  const currentValue = fisherTransformedValues[length - 1];
  const inflexionPointAbsolute = inflexionPoint * multiplier;
  if (currentValue * multiplier >= inflexionPointAbsolute) {
    for (let i = length - 2; i >= 0; i -= 1) {
      const fisherTransformedValueAbsolute =
        fisherTransformedValues[i] * multiplier;
      if (fisherTransformedValueAbsolute >= inflexionPointAbsolute) {
        return false;
      }

      if (fisherTransformedValueAbsolute <= 0) {
        return true;
      }
    }
    return true;
  }
  return false;
};

const hasChangedSign = (fisherTransformedValues, extremePoint) => {
  const { length } = fisherTransformedValues;
  const multiplier = extremePoint > 0 ? 1 : -1;
  const currentValue = fisherTransformedValues[length - 1];
  const extremePointAbsolute = extremePoint * multiplier;
  if (currentValue * multiplier <= 0) {
    for (let i = length - 2; i >= 0; i -= 1) {
      const fisherTransformedValueAbsolute =
        fisherTransformedValues[i] * multiplier;
      if (fisherTransformedValueAbsolute <= 0) {
        return false;
      }
      if (fisherTransformedValueAbsolute >= extremePointAbsolute) {
        return true;
      }
    }
    return true;
  }
  return false;
};

const round = (val) => {
  if (val > 0.99) {
    return 0.999;
  }
  if (val < -0.99) {
    return -0.999;
  }
  return val;
};

const getFisherTransformedValues = (normalizedPrices) => {
  const fisherTransformedValues = [0];
  for (let i = 0; i < normalizedPrices.length; i += 1) {
    const fisherTransformedValue =
      0.5 * Math.log((1 + normalizedPrices[i]) / (1 - normalizedPrices[i])) +
      0.5 * fisherTransformedValues[i];
    fisherTransformedValues.push(fisherTransformedValue);
  }
  fisherTransformedValues.shift();
  return fisherTransformedValues;
};

const queue = (() => {
  const hl2Array = [];
  const add = (hl2) => {
    hl2Array.push(hl2);
    if (hl2Array.length > FISHER_TRANSFORM_LOOKBACK_PERIOD) hl2Array.shift();
  };
  const getHL2Min = () => Math.min(...hl2Array);
  const getHL2Max = () => Math.max(...hl2Array);
  return { add, getHL2Min, getHL2Max };
})();

const getNormalizedPrices = (prices) => {
  const hl2Array = prices.map((price) => (price.high + price.low) / 2);
  const normalizedPrices = [0.0];
  for (let i = 0; i < prices.length; i += 1) {
    const hl2 = hl2Array[i];
    queue.add(hl2);
    const hl2Min = queue.getHL2Min();
    const hl2Max = queue.getHL2Max();
    const normalizedPrice = round(
      0.66 * ((hl2 - hl2Min) / (hl2Max - hl2Min) - 0.5) +
        0.67 * normalizedPrices[i]
    );
    normalizedPrices.push(normalizedPrice);
  }
  normalizedPrices.shift();
  return normalizedPrices;
};
const getPrices = (candles) => {
  const prices = [];
  candles.forEach((candle) => {
    const highString = candle.high;
    const lowString = candle.low;
    const high = parseFloat(highString);
    const low = parseFloat(lowString);
    prices.push({ high, low });
  });
  return prices;
};

const checkPattern = (candles, name) => {
  const prices = getPrices(candles);
  const normalizedPrices = getNormalizedPrices(prices);
  const fisherTransformedValues = getFisherTransformedValues(normalizedPrices);
  if (fisherTransformedValues.length < FISHER_TRANSFORM_LOOKBACK_PERIOD) {
    console.log(
      `Skipping ${name}. Number of Available Candles (${fisherTransformedValues.length}) is lower than Lookback Period (${FISHER_TRANSFORM_LOOKBACK_PERIOD})\nConsider adding it to exceptions untill there are enough datapoints`
    );
    return false;
  }
  for (let i = 0; i < INFLEXION_POINTS.length; i += 1) {
    const inflexionPoint = INFLEXION_POINTS[i];
    if (checkInflexionPoint(fisherTransformedValues, inflexionPoint))
      return `Reached inflexion point ${inflexionPoint} from 0`;
  }
  if (HAS_ZERO) {
    if (hasChangedSign(fisherTransformedValues, LOW_EXTREME))
      return `Reached 0 from low extreme point ${LOW_EXTREME}`;
    if (hasChangedSign(fisherTransformedValues, HIGH_EXTREME))
      return `Reached 0 from high extreme point ${HIGH_EXTREME}`;
  }
  return false;
};

const FisherTransform = (pair) => {
  const { symbol, timeframe } = pair;
  const name = `FisherTransform${symbol}${timeframe}`;
  const nrOfCandles = CANDLES_PER_REQUEST;
  const alert = Alert(name, nrOfCandles, checkPattern);
  const { evaluateAndNotify } = alert;
  return { evaluateAndNotify };
};

module.exports = { FisherTransform };
