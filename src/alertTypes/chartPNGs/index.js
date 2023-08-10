const { createCanvas, registerFont } = require("canvas");
const fs = require("fs");
const { join } = require("path");

// Chart dimensions
const canvasWidth = 800;
const canvasHeight = 400;
const margin = 40;
const oneDayInMiliSeconds = 24 * 60 * 60 * 1000;

// Function to normalize data values to fit the canvas
function normalizeValue(value, minValue, maxValue, scale) {
  return ((value - minValue) * scale) / (maxValue - minValue);
}

function formatMonthDay(unixTimestamp) {
  const offset = 3 * 60 * 60 * 1000; // Offset for GMT+3 in milliseconds
  const date = new Date((unixTimestamp + offset) * 1000); // Convert to milliseconds
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDay()).padStart(2, "0");
  return `${month}/${day}`;
}

function formatHourMinute(unixTimestamp) {
  const tsOptions = {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const formattedTs = new Date(unixTimestamp).toLocaleTimeString(
    "en-US",
    tsOptions
  );
  return formattedTs;
}

function parseCandleStickData(dataArray) {
  const convertedData = dataArray.map((data) => {
    const { ts, open, high, low, close } = data;
    return {
      ts: parseInt(ts, 10),
      open: parseFloat(open),
      high: parseFloat(high),
      low: parseFloat(low),
      close: parseFloat(close),
    };
  });

  const timePeriodInMiliseconds = convertedData[1].ts - convertedData[0].ts;
  const formatOption =
    timePeriodInMiliseconds > oneDayInMiliSeconds
      ? formatMonthDay
      : formatHourMinute;
  const formattedData = convertedData.map((data) => {
    const { ts } = data;
    const formattedTs = formatOption(ts);
    return { ...data, ts: formattedTs };
  });
  return formattedData;
}

// Draw the candlestick chart
function drawCandlestickChart(rawData) {
  // Create a canvas with a transparent background
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext("2d");

  const data = parseCandleStickData(rawData);
  const maxPrice = Math.max(...data.map((entry) => entry.high));
  const minPrice = Math.min(...data.map((entry) => entry.low));
  const priceScale = canvasHeight - 2 * margin;
  const candleWidth = (canvasWidth - 2 * margin) / data.length;

  // Set a transparent background
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw Y-axis
  ctx.strokeStyle = "white";
  ctx.lineWidth = 1;
  const yAxisX = canvasWidth - margin * 1.8;
  ctx.beginPath();
  ctx.moveTo(yAxisX, margin);
  ctx.lineTo(yAxisX, canvasHeight - margin);
  ctx.stroke();

  // Draw Y-axis labels
  const fontPath = join(__dirname, "./Roboto-Bold.ttf");
  registerFont(fontPath, { family: "Roboto" });
  ctx.font = "bold 12px Roboto";
  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const priceStep = (maxPrice - minPrice) / 5;
  for (let i = 0; i <= 5; i += 1) {
    const priceValue = minPrice + i * priceStep;
    const yPosition =
      canvasHeight -
      margin -
      normalizeValue(priceValue, minPrice, maxPrice, priceScale);
    ctx.fillText(
      priceValue > 1 ? priceValue.toFixed(2) : priceValue.toFixed(4),
      yAxisX + 5,
      yPosition
    );
  }

  // Draw the candlesticks
  data.forEach((entry, index) => {
    const x = (index + 0.5) * candleWidth;
    const yOpen =
      canvasHeight -
      margin -
      normalizeValue(entry.open, minPrice, maxPrice, priceScale);
    const yClose =
      canvasHeight -
      margin -
      normalizeValue(entry.close, minPrice, maxPrice, priceScale);
    const yHigh =
      canvasHeight -
      margin -
      normalizeValue(entry.high, minPrice, maxPrice, priceScale);
    const yLow =
      canvasHeight -
      margin -
      normalizeValue(entry.low, minPrice, maxPrice, priceScale);

    // Draw candlestick body
    ctx.strokeStyle =
      entry.open > entry.close
        ? "rgba(104, 150, 229, 1)"
        : "rgba(252, 241, 205, 1";
    ctx.lineWidth = candleWidth * 1;
    ctx.beginPath();
    ctx.moveTo(x, yOpen);
    ctx.lineTo(x, yClose);
    ctx.stroke();

    // Draw candlestick wick
    ctx.strokeStyle =
      entry.open > entry.close
        ? "rgba(104, 150, 229, 1)"
        : "rgba(252, 241, 205, 1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, yHigh);
    ctx.lineTo(x, yLow);
    ctx.stroke();

    // Draw X-axis label centered on the candle
    ctx.fillStyle = "white";
    ctx.font = "bold 12px Sans";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(entry.ts, x, canvasHeight - margin + 5);
  });

  return canvas;
}

const generateImage = async (candlestickData, path) => {
  const canvas = drawCandlestickChart(candlestickData);
  try {
    // Save the chart as an image
    const out = fs.createWriteStream(path);
    const stream = canvas.createPNGStream();
    stream.pipe(out);
    await new Promise((resolve, reject) => {
      out.on("finish", resolve);
      out.on("error", reject);
    });
    return true;
  } catch (error) {
    console.error(
      `Error saving candlestick chart image on path ${path}:`,
      error
    );
    return false;
  }
};

module.exports = generateImage;
