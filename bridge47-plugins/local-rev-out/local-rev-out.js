
/**
 *  For working on a local workstation.
 *
 *  $ [cd bridge47]
 *  $ pm2 start bridge47-plugins/local-rev-out/local-rev-out.js --watch -- --port=5777 --main
 *  $ sudo nginx -t && sudo nginx
 *
 *  You also need sacurl.
 *  You also need nginx.conf files.
 *
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const revProxyLib             = require('../../lib/rev-proxy');
const path                    = require('path');
const http                    = require('http');
const urlLib                  = require('url');

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;
const revProxy                = revProxyLib.revProxy;

const HOME                    = process.env.HOME;
const USER                    = process.env.USER;

var lib = {};

const main = function(callback) {
console.log('main');
  var   ip          = ARGV.ip           || '127.0.0.1';
  const port        = ARGV.port         || 5777;
  const protocol    = ARGV.protocol     || 'http';
  const domainName  = ARGV.domain       || 'mobilewebassist.net';
  const subDomain   = ARGV.sub_domain   || 'b47console';
  const targetFqdn  = ARGV.target       || `${subDomain}.${domainName}`;

  const destUrlObj    = _.pick(urlLib.parse(`${protocol}://${targetFqdn}`), 'protocol', 'host');

  const server = http.createServer(function(req, res) {

    console.log(req.url);
    //console.log(req.headers);
    //console.log(req.connection.remoteAddress);

    // We are a long-poll server
    req.setTimeout(0);
    res.setTimeout(0);

    var args = [];

    args.push('--cert', path.join(HOME, '.ssh/keys/serverassist/client-certs', USER+'_mobilewebassist_client.pem'));
    args.push('--cacert', path.join(HOME, '.ssh/keys/serverassist/mobilewebassist_root_server_ca.crt'));

    return revProxy(req, res, destUrlObj, {args});
  });

  return server.listen(port, ip, function() {
    console.log(`local-rev-proxy listening on ${ip}:${port}`);
  });
};



if (sg.callMain(ARGV, __filename)) {
  return main(function(err, result) {
    if (err)      { console.error(err); return process.exit(2); }
    if (result)   { console.log(result); }
  });
}

