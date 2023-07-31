/* eslint-disable no-await-in-loop */
/* eslint-disable no-constant-condition */
require("dotenv").config();
const { setTimeout } = require("timers/promises");
const RequestBatcher = require("./src/requestBatcher");

const run = async () => {
  const { INTERVAL_DURATION_IN_MILISECONDS } = process.env;

  while (true) {
    const startTime = Date.now();

    await RequestBatcher.run();

    const endTime = Date.now();
    const elapsedTime = endTime - startTime;
    const remainingTime = Math.max(
      0,
      INTERVAL_DURATION_IN_MILISECONDS - elapsedTime
    );
    await setTimeout(remainingTime);
  }
};

run();
