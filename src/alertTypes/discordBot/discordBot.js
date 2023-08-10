const { REST } = require("@discordjs/rest");
const { ChannelsAPI } = require("@discordjs/core");
const path = require("path");
const { readFileSync } = require("fs");

const discordBot = (() => {
  const { DISCORD_TOKEN } = process.env;
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  const channelsAPI = new ChannelsAPI(rest);
  const sendAlert = (alertObject, imagePath = null) => {
    const { channelName, symbol, timeframe, status } = alertObject;
    let CHANNEL_ID;
    if (channelName === "Candle Pattern")
      CHANNEL_ID = process.env.CHANNEL_ID_CANDLE_PATTERN;
    else if (channelName === "Fisher Transform")
      CHANNEL_ID = process.env.CHANNEL_ID_FISHER_TRANSFORM;
    const content = `${symbol}/${timeframe}: ${status}`;
    if (imagePath) {
      const data = readFileSync(imagePath);
      const name = path.basename(imagePath);
      const files = [
        {
          data,
          name,
        },
      ];
      channelsAPI.createMessage(CHANNEL_ID, {
        content,
        files,
      });
    } else channelsAPI.createMessage(CHANNEL_ID, { content });
  };
  return { sendAlert };
})();

module.exports = discordBot;
