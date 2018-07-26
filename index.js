const DEBUG = false;

var InputModule;

if (DEBUG) {
  InputModule = require('./readline_console');
} else {
  InputModule = require('./service_ls2');
}
