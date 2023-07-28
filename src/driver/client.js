const { SpotClient } = require("bitget-api");

const Client = new SpotClient({
  apiKey: process.env.API_KEY,
  apiSecret: process.env.API_SECRET,
  apiPass: process.env.API_PASS,
});

module.exports = Client;
