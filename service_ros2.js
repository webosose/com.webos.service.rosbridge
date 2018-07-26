const rclnodejs = require('rclnodejs');
const Test = rclnodejs.require('nav_msgs/msg/Odometry')

var rosBridgeNode;
var ServiceRos2 = {};

function init(callback) {
  rclnodejs.init().then(() => {
    rosBridgeNode = rclnodejs.createNode('ros_bridge_for_webOS');
    rclnodejs.spin(rosBridgeNode);
    if (callback)
      callback();
  });
}

function shutdown() {
  rclnodejs.shutdown();
}

function replyError(errorText, callback) {
  var responsePayload = {};
  responsePayload.errorText = errorText;
  responsePayload.returnValue = false;
  callback(responsePayload);
}

function replySuccess(callback) {
  var responsePayload = {};
  responsePayload.returnValue = true;
  callback(responsePayload);
}

var publishers = {};

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
  if (!publishers[name]) {
    try {
      publishers[name] = rosBridgeNode.createPublisher(type, name);
    } catch (err) {
      console.log(err);
      replyError("Cannot create ros publisher", callback);
      return;
    }
  }

  publishers[name].publish(message);
  replySuccess(callback);
}

var subscribers = {};

function subscribe(type, name, callback) {
  if (!type) {
    replyError("'type' is required parameter", callback);
    return;
  }
  if (!name) {
    replyError("'name' is required parameter", callback);
    return;
  }
  if (!subscribers[name]) {
    try {
      var rosnode = rosBridgeNode.createSubscription(type, name, (response) => {
        for (var i = 0; i < subscribers[name].clients.length; ++i) {
          subscribers[name].clients[i](response);
        }
      });
      subscribers[name] = {};
      subscribers[name].rosnode = rosnode;
      subscribers[name].clients = [];
    } catch (err) {
      console.log(err);
      replyError("Cannot create ros subscription", callback);
      return;
    }
  }
  subscribers[name].clients.push(callback);
}

var clients = {};

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
  if (!clients[name]) {
    try {
      clients[name] = rosBridgeNode.createClient(type, name);
    } catch (err) {
      console.log(err);
      replyError("Cannot create ros client", callback);
      return;
    }
  }
  clients[name].sendRequest(message, callback);
}

module.exports = ServiceRos2;
module.exports.init = init;
module.exports.shutdown = shutdown;
module.exports.publish = publish;
module.exports.subscribe = subscribe;
module.exports.call = call;
