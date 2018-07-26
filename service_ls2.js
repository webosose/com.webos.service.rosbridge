var WebosService = require("webos-service");
var PmLogLib = require("pmloglib");

var SERVICE_NAME = "com.webos.service.rosbridge";

var ros2 = require('./service_ros2');
var service = new WebosService(SERVICE_NAME);

ros2.init();

function replyError(errorText, message) {
  var responsePayload = {};
  responsePayload.errorText = errorText;
  responsePayload.returnValue = false;
  message.respond(responsePayload);
}

function replySuccess(message) {
  var responsePayload = {};
  responsePayload.returnValue = true;
  message.respond(responsePayload);
}

service.register("list", function(message) {
  replySuccess(message);
});

service.register("status", function(message) {
  replySuccess(message);
});

service.register("call", function(message) {
  if (!message.payload) {
    replyError("'payload' is empty", message)
    return;
  }
  ros2.call(message.payload.type, message.payload.name, message.payload.message, function(response) {
    message.respond(response);
  });
});

service.register("subscribe", function(message) {
  console.log("subscribe - 000")
  if (!message.payload) {
    replyError("'payload' is empty", message)
    return;
  }
  ros2.subscribe(message.payload.type, message.payload.name, (response) => {
    console.log("subscribe - 111")
    message.respond(response);
    console.log("subscribe - 222")

    if (global.gc) {
      global.gc();
    } else {
      console.log('Garbage collection unavailable.  Pass --expose-gc when launching node to enable forced garbage collection.');
    }
  });
});

service.register("publish", (message) => {
  console.log("publish - 000")
  if (!message.payload) {
    replyError("'payload' is empty", message)
    return;
  }
  ros2.publish(message.payload.type, message.payload.name, message.payload.message, (response) => {
    console.log("publish - 111")
    message.respond(response);
    console.log("publish - 222")
  });
});

module.exports = service;