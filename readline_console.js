
const readline = require('readline');
var service = require('./service_ros2');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'ros_bridge> '
});

service.init(function() {
  rl.prompt();
});

rl.on('line', (line) => {
  var commands = line.split(' ');
  console.log('commands : ' + commands);
  switch (commands[0].trim()) {
    case 'publish':
      // publish std_msgs/msg/String topic 3333
      // publish std_msgs/msg/String test1 2222
      // publish std_msgs/msg/String test2 4444
      service.publish(commands[1], commands[2], commands[3], function(response) {
        console.log(response);
      });
      break;

    case 'subscribe':
      // subscribe std_msgs/msg/String test1
      // subscribe std_msgs/msg/String test2
      // subscribe std_msgs/msg/String chatter
      service.subscribe(commands[1], commands[2], function(response) {
        console.log(response);
      });
      break;

    case 'client':
      // client example_interfaces/srv/AddTwoInts add_two_ints
      // client example_interfaces/AddTwoInts add_two_ints
      message = {};
      message.a = 100;
      message.b = 200;
      service.call(commands[1], commands[2], message, function(response) {
        console.log(response);
      });
      break;

    default:
      console.log(`Invalid command - '${line.trim()}'`);
      break;
  }
  rl.prompt();
}).on('close', () => {
  console.log('Have a great day!');
  process.exit(0);
});