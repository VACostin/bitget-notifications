const { REST } = require("@discordjs/rest");
const { ChannelsAPI } = require("@discordjs/core");

const discordBot = (() => {
  const { CHANNEL_ID, DISCORD_TOKEN } = process.env;
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  const channelsAPI = new ChannelsAPI(rest);
  const sendAlert = (alertObject) => {
    const { symbol, timeframe, status } = alertObject;
    const message = `${symbol}/${timeframe}: ${status}`;
    channelsAPI.createMessage(CHANNEL_ID, { content: message });
  };
  return { sendAlert };
})();

module.exports = discordBot;
