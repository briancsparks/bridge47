
/**
 *  Get bridge47 up and working.
 *
 *  pm2 start bridge47.js --watch -- agent --main
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const path                    = require('path');
const sh                      = sg.extlibs.shelljs;

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;

var   usage;

var   commands                = {};

const main = function() {
  var   command = ARGV.args.shift();

  command = command || (ARGV.help ? 'help' : command);

  if (!command) {
    return usage('Must supply a command.');
  }

  if (commands[command]) {
    return commands[command]();
  }

  /* otherwise */
  return usage('Unknown command: '+command);
};

commands.help = commands.usage = function() {
  return usage();
};

/**
 *  Start the instance agent.
 */
commands.agent = commands.commandServer = commands['command-server'] = commands.cmd = function() {
  const agent             = require('./agent/agent');

  return agent.runAgentServer({}, {}, function(err, launched) {
  });
};

/**
 *  Configure anything on the instance that has a bridge47-plugins dir.
 */
commands.configPlugins = function() {

  sh.pushd(path.join(process.env.HOME, 'dev'));
  const plugins   = pluginDirs();

  _.each(plugins, function(pluginDir) {
    sh.cd(pluginDir);

    sh.exec('npm install --production');
  });
  sh.popd();

};

/**
 *
 */
commands.startPlugins = function() {
};

usage = function(message) {
  if (message) {
    console.log(message);
  }

  console.log(
`Usage: bridge47 command ...

    commands: agent (alias: command-server, cmd)
                --port[=12340]
                --ip[=127.0.0.1]`);
};



if (sg.callMain(ARGV, __filename)) {
  main();
} else {
  // Being required
  var lib = {};

  lib = sg.reduce(require('./lib/redis-utils'), lib, function(m, value, key) { return sg.kv(m, key, value); });

  _.each(lib, function(value, key) {
    exports[key] = value;
  });
}

function pluginDirs() {
  return sh.find(path.join(process.env.HOME, 'dev')).filter((file) => {
    return file.match(/bridge47-plugins/i) && file.endsWith('package.json') && !file.match(/node_modules/i);
  }).map(file => path.dirname(file));;
}

