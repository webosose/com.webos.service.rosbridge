g_logger = {
  // "pmlog" is supported
  // "ros" is will be supported
  logType: "pmlog",
  logContext: null
}

function init() {
  try {
    if (g_logger.logType === "pmlog") {
      pmloglib = require("pmloglib.node");
      g_logger.logContext = new pmloglib.Context("rosbridge");
    }
  } catch (ex) {
    console.log('pmlog is not supported')
    g_logger.logType = "console";
  }
}

function log(message) {
  switch(g_logger.logType) {
  case "console":
    console.log("[ROS BRIDGE] " + message);
    break;

  case "pmlog":
    // log level is not supported yet
    g_logger.logContext.log(6, 'rosbridge', {}, message);
    break;

  case "ros":
    console.log("[ROS BRIDGE] ros is not supported yet");
    break;
  }
}

function getQuoteStr(message) {
  return "'" + message + "'";
}

module.exports = g_logger;
module.exports.init = init;
module.exports.log = log;
module.exports.getQuoteStr = getQuoteStr;