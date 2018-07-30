var palmbus = require("palmbus");
var logger = require("./logger");
var SERVICE_NAME = "com.webos.service.rosbridge";

var ros2 = require('./service_ros2');
var service;
logger.init();
ros2.init(function(){
  service = new Service();
});

function Service() {
  var self = this;
  try {
    this.handle = new palmbus.Handle(SERVICE_NAME);
    logger.log("ls2 service is ready");
    this.handle.addListener("request", function(message) {
      self.onRequest(message);
    });
  } catch (ex) {
    logger.log(ex);
  }
  this.handle.registerMethod("/", "publish");
  this.handle.registerMethod("/", "subscribe");
  this.handle.registerMethod("/", "call");
  logger.log("APIs are registered");
}

Service.prototype.replyError = function(errorText, message) {
  logger.log(errorText);
  var responsePayload = {};
  responsePayload.errorText = errorText;
  responsePayload.returnValue = false;
  message.respond(JSON.stringify(responsePayload));
}

Service.prototype.onRequest = function(message) {
  var method = message.method();
  var requestPayload;

  // check JSON format
  logger.log(logger.getQuoteStr(method) + ' API is called');
  try {
    requestPayload = JSON.parse(message.payload());
  } catch (ex) {
    this.replyError("Invalid JSON format", message)
    return;
  }
 
  switch(method) {
  case "publish":
    this.publish(message, requestPayload);
    break;

  case "subscribe":
    this.subscribe(message, requestPayload);
    break;

  case "call":
    this.call(message, requestPayload);
    break;
  }
}

Service.prototype.subscribe = function(message, requestPayload) {
  if (!message.isSubscription()) {
    this.replyError("'subscribe' should be 'true'", message)
    return;
  }

  const statusPayload = {
    serviceName: message.sender(),
    subscribe: true
  }
  var request = this.handle.subscribe("luna://com.webos.service.bus/signal/registerServerStatus", JSON.stringify(statusPayload));
	request.addListener("response", function(statusMessage) {
    var status = JSON.parse(statusMessage.payload());

    if (status.connected == false) {
      ros2.stopSubscribe(status.serviceName);
    }
  });
  logger.log(logger.getQuoteStr(statusPayload.serviceName) + ' monitoring starts');

  ros2.startSubscribe(requestPayload.type, requestPayload.name, message.sender(), (responsePayload) => {
    message.respond(JSON.stringify(responsePayload));
  });
  logger.log(logger.getQuoteStr(statusPayload.serviceName) + ' subscription starts');
  message.respond(JSON.stringify({ subscribed: true}));
}

Service.prototype.publish = function(message, requestPayload) {
  ros2.publish(requestPayload.type, requestPayload.name, requestPayload.message, (responsePayload) => {
    message.respond(JSON.stringify(responsePayload));
  });
}

Service.prototype.call = function(message, requestPayload) {
  ros2.call(requestPayload.type, requestPayload.name, requestPayload.message, function(responsePayload) {
    message.respond(JSON.stringify(responsePayload));
  });
}