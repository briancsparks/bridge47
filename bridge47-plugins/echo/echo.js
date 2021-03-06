
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const unhandledRoutes         = require('../../lib/unhandled-routes');
const redisUtils              = require('../../lib/redis-utils');
const http                    = require('http');
const urlLib                  = require('url');
const request                 = sg.extlibs.superagent;

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;
const unhandled               = unhandledRoutes.unhandled;
const stack                   = ARGV.stack;
const color                   = ARGV.color;
const project                 = ARGV.project;

const main = function() {

  const port        = ARGV.port;

  if (!port || !color || !stack || !project) {
    console.log('Need --port= and --color= and --stack= and --project=');
    process.exit(2);
  }

  const server = http.createServer(function(req, res) {

    // We are a long-poll server
    req.setTimeout(0);
    res.setTimeout(0);

    var result = {};

    const url = urlLib.parse(req.url, true);

    _.extend(result, url);
    _.extend(result, {headers: req.headers});

    console.log('Echoing: '+req.url);
    return sg._200(req, res, result, {}, {"X-B47-Echo-Color" : process.env.B47_COLOR || 'nocolor'});
  });

  return request.get('http://169.254.169.254/latest/meta-data/local-ipv4').end((err, result) => {
    var   ip;

    if (sg.ok(err, result) && result.text) {
      ip = result.text;
    }

    ip  = ARGV.ip || ip || '127.0.0.1';

    const projectRoute = `/${project}/${color}`;
    const xapiRoute    = `/${project}/xapi/v1/${color}/echo`;

    console.log(`echo handling ${projectRoute}`);
    console.log(`echo handling ${xapiRoute}`);

    return server.listen(port, ip, function() {
      console.log(`Listening on ${ip}:${port}`);

      tell();
      function tell() {
        setTimeout(tell, 15 * 1000);
        redisUtils.tellStackService(projectRoute, `http://${ip}:${port}`, 30000, stack, function(err) {
          redisUtils.tellStackService(xapiRoute, `http://${ip}:${port}`, 30000, stack, function(err) {
          });
        });
      };
    });
  });
};






main();


