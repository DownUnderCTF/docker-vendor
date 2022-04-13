// This is a custom hardhat.config.js file that will override the startup params

module.exports = {
    networks: {
        hardhat: {
          mining: {
            auto: false,
            interval: 5000
          }
        }
      }
};