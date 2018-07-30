const rclnodejs = require('rclnodejs');
var logger = require('./logger.js');

var g_serviceRos2 = {
  node: null,
  publishers: {},
  subscribers: {},
  clients: {}
};

function init(callback) {
  rclnodejs.init().then(() => {
    logger.log("rclnodejs is initialized");
    g_serviceRos2.node = rclnodejs.createNode('ros_bridge_for_webOS');
    rclnodejs.spin(g_serviceRos2.node);
    logger.log("spin loop starts");
    if (callback) {
      logger.log("rclnodejs callback calls");
      callback();
    }
  });
}

function shutdown() {
  rclnodejs.shutdown();
  logger.log("rclnodejs is destroyed");
}

function replyError(errorText, callback) {
  logger.log(errorText);
  if (callback == null) {
    logger.log("callback is null");
    return;
  }
  var responsePayload = {};
  responsePayload.errorText = errorText;
  responsePayload.returnValue = false;
  callback(responsePayload);
}

function replySuccess(callback) {
  if (callback == null) {
    logger.log("callback is null");
    return;
  }
  var responsePayload = {};
  responsePayload.returnValue = true;
  callback(responsePayload);
}

function call(type, name, message, callback) {
  if (!type) {
    replyError("'type' is required parameter", callback);
    return;
  }
  if (!name) {
    replyError("'name' is required parameter", callback);
    return;
  }
  if (!message) {
    replyError("'message' is required parameter", callback);
    return;
  }
  if (!g_serviceRos2.clients[name]) {
    try {
      g_serviceRos2.clients[name] = g_serviceRos2.node.createClient(type, name);
      logger.log(logger.getQuoteStr(name) + " New ROS2 client is added");
    } catch (err) {
      replyError("Cannot create ros client", callback);
      return;
    }
  }
  g_serviceRos2.clients[name].sendRequest(message, callback);
  logger.log(logger.getQuoteStr(name) + " Call ROS2 Service");
}

function publish(type, name, message, callback) {
  if (!type) {
    replyError("'type' is required parameter", callback);
    return;
  }
  if (!name) {
    replyError("'name' is required parameter", callback);
    return;
  }
  if (!message) {
    replyError("'message' is required parameter", callback);
    return;
  }
  if (!g_serviceRos2.publishers[name]) {
    try {
      g_serviceRos2.publishers[name] = g_serviceRos2.node.createPublisher(type, name);
      logger.log(logger.getQuoteStr(name) + " New ROS2 publisher is added");
    } catch (err) {
      replyError("Cannot create ros publisher", callback);
      return;
    }
  }

  g_serviceRos2.publishers[name].publish(message);
  logger.log(logger.getQuoteStr(name) + " Publish ROS2 topic");
  // TODO: Delete publisher when LS2 world entry is died.
  replySuccess(callback);
}

function startSubscribe(type, name, lunaClient, callback) {
  if (!type) {
    replyError("'type' is required parameter", callback);
    return;
  }
  if (!name) {
    replyError("'name' is required parameter", callback);
    return;
  }
  if (!g_serviceRos2.subscribers[name]) {
    try {
      var rosnode = g_serviceRos2.node.createSubscription(type, name, (response) => {
        for (var i = 0; i < g_serviceRos2.subscribers[name].lunaClients.length; ++i) {
          // Should not write log here for performance reason
          g_serviceRos2.subscribers[name].lunaClients[i].callback(response);
        }
      });
      logger.log(logger.getQuoteStr(name) + " New ROS2 subscriber is added");
      g_serviceRos2.subscribers[name] = {};
      g_serviceRos2.subscribers[name].rosnode = rosnode;
      g_serviceRos2.subscribers[name].lunaClients = [];
    } catch (err) {
      replyError("Cannot create ros subscription", callback);
      return;
    }
  }
  var item = {};
  item.client = lunaClient;
  item.callback = callback;
  g_serviceRos2.subscribers[name].lunaClients.push(item);
  logger.log(logger.getQuoteStr(lunaClient) + " subscriber is added");
}

function stopSubscribe(lunaClient) {
  for (var name in g_serviceRos2.subscribers) {
    for (var i = 0; i < g_serviceRos2.subscribers[name].lunaClients.length; ++i) {
      if (g_serviceRos2.subscribers[name].lunaClients[i].client === lunaClient) {
        g_serviceRos2.subscribers[name].lunaClients.splice(i, 1);
        logger.log(logger.getQuoteStr(lunaClient) + " is removed");
      }
      if (g_serviceRos2.subscribers[name].lunaClients.length === 0) {
        g_serviceRos2.node.destroySubscription(g_serviceRos2.subscribers[name].rosnode);
        delete g_serviceRos2.subscribers[name];
        logger.log(logger.getQuoteStr(name) + " subscriber is removed");
        break;
      }
    }
  }
}

module.exports = g_serviceRos2;
module.exports.init = init;
module.exports.shutdown = shutdown;
module.exports.call = call;
module.exports.publish = publish;
module.exports.startSubscribe = startSubscribe;
module.exports.stopSubscribe = stopSubscribe;
