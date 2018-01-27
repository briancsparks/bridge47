
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const unhandledRoutes         = require('../../lib/unhandled-routes');
const redisUtils              = require('../../lib/redis-utils');
const utils                   = require('../../lib/utils');
const adminsDb                = require('../../lib/admins-db');
const http                    = require('http');
const urlLib                  = require('url');
const redisLib                = require('redis');

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;
const unhandled               = unhandledRoutes.unhandled;
const redisPort               = argvGet(ARGV, 'redis-port')             || 6379;
const redisHost               = argvGet(ARGV, 'redis-host')             || 'redis';

const redis                   = redisLib.createClient(redisPort, redisHost);

const main = function() {

  const ip          = ARGV.ip       || '127.0.0.1';
  const port        = ARGV.port;

  if (!port) {
    console.log('Need --port=');
    process.exit(2);
  }

  var serviceIndex = 0;

  const server = http.createServer(function(req, res) {

    // We are a long-poll server
    req.setTimeout(0);
    res.setTimeout(0);

    const url   = urlLib.parse(req.url, true);
    const parts = _.rest(url.pathname.toLowerCase().split('/'));

    // ---------- Verify user ----------

    return sg.__run([function(next) {

      // A header of X-Client-Verify means nginx was told to check client certs
      if (req.headers['x-client-verify']) {
        const serverSigner   = req.headers['x-client-i-dn'];
        const clientCryptoId = req.headers['x-client-s-dn'];
        const email          = (utils.parseClientCert(clientCryptoId || '') || {}).CN;

        console.log(req.headers);

        if (!serverSigner || !clientCryptoId || !email) {
          return sg._403(req, res);
        }

        // Now, look up the email in our DB
        return adminsDb.get(email, {}, function(err, result) {
          if (!sg.ok(err, result)) { return sg._403(req, res); }

          const role = deref(result, 'Item.rolerole.S');
          if (role !== 'admin') { return sg._403(req, res); }

          return next();
        });
      }

      return next();

    }, function(next) {
      if (parts.length === 0) {
        return sg._400(req, res);
      }

      var   serviceNames = [];

      if (parts.length >= 3) {
        // Try for the longer service name
        if (parts[1].match(/(xapi|api)/) && parts[2].match(/v[0-9.]+/)) {
          if (parts.length >= 4) {
            serviceNames.push('/'+parts.slice(0, 4).join('/'));
          }
          serviceNames.push('/'+parts.slice(0, 3).join('/'));
        }
      }

      serviceNames.push('/'+parts[0]);

      var service;

      // Now, simply see if anyone has registered for any of them

      return sg.__each(serviceNames, function(serviceName, next) {
        return getServices(serviceName, (err, services) => {
          if (!sg.ok(err, services)) { return next(); }

          // Are there any services available?
          if (services.length === 0) { return next(); }

          // If so, pick one
          if (++serviceIndex >= services.length) {
            serviceIndex -= services.length;
            if (serviceIndex >= services.length) {
              serviceIndex = 0;
            }
          }

          service = services[serviceIndex++];
          return next();
        });
      }, function() {
        return next();
      });

    }, function(next) {
      // Check that we have a service
      if (service) { return next(); }

      // Nope.  Do more?  Just 404.
      if (!isProd()) {
        console.log('No services found for: ', serviceNames);
      }

      return unhandled(req, res);

    }], function done() {
      // Got one -- Magic nginx potion
      // location ~* ^/rpxi/GET/(.*) {...}
      // location ~* ^/rpxissl/GET/(.*) {...}

      // TODO: if we are rpxi-ing ssl, use ssl version
      const svc     = service.replace(/(http|https):[/][/]/i, '');

      const redir   = sg.normlz(`/rpxi/${req.method.toUpperCase()}/${svc}/${req.url}`);

      console.log('xapi: '+url.pathname+' --> '+redir);

      res.statusCode = 200;
      res.setHeader('X-Accel-Redirect', redir);
      res.end();
    });

  });

  server.listen(port, ip, function() {
    console.log(`Xapi listening on ${ip}:${port}`);
  });
};




const maintainTime = function() {
  // First, schedule next maintenance
  setTimeout(maintainTime, 1000*30);
  hourHasBeenComputed = false;
};
maintainTime();


main();

function getServices(name, callback) {
  const root = `service:${name}`;

  var result = [];
  return sg.__eachll(getThreeHours(), (h, next) => {
    return redis.smembers(`${root}:${h}`, function(err, members) {
      if (!sg.ok(err, members)) { return next(); }

      return redis.mget(members, function(err, services) {
        if (!sg.ok(err, services)) { return next(); }

        result = result.concat(services);
        return next();
      });
    });
  }, function() {
    return callback(null, result);
  });
}

function getThreeHours() {
  const current = redisUtils.getHour();
  const prev    = current === 0 ? 23 : current -1;
  const next    = current === 23 ? 0 : current +1;

  return [prev, current, next];
}

function isProd() {
  return process.env.NODE_ENV === 'production';
}


