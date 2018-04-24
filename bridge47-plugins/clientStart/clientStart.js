
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const unhandledRoutes         = require('../../lib/unhandled-routes');
const utils                   = require('../../lib/utils');
const http                    = require('http');
const urlLib                  = require('url');
const dbUtil                  = require('../../lib/db');
var   MongoClient             = require('mongodb').MongoClient;

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;
const unhandled               = unhandledRoutes.unhandled;
const upsertOne               = dbUtil.upsertOne;

var   namespace               = 'bridge47';
var   bootstrap;

const main = function() {

  const ip          = ARGV.ip       || '127.0.0.1';
  const port        = ARGV.port;

  if (!port) {
    console.log('Need --port=');
    process.exit(2);
  }

  return bootstrap(function(err, db, config_) {
    const configDb  = db.db('bridge47').collection('config');

    const server = http.createServer(function(req, res) {

      const url       = urlLib.parse(req.url, true);
      const urlParts  = _.rest(url.pathname.split('/'));

      if (urlParts.length === 0 || _.last(urlParts).toLowerCase() !== 'clientstart') {
        return unhandled(req, res);
      }

      // We are a long-poll server
      req.setTimeout(0);
      res.setTimeout(0);

      const now         = new Date();
      var   msg           = '';
      var   projectId, sessionId, clientId;

      if (req.headers.host) {
        msg += req.headers.host;
      }
      msg += url.pathname;

      if (urlParts.length > 1) {
        projectId = urlParts[0];
      }

      var result = {upstreams:{}, preference:{}};

      return sg.getBody(req, function(err) {
        if (err) { console.error(msg); return unhandled(req, res); }

        var   who;

        // Collect all the interesting items
        const all   = sg._extend(url.query, req.bodyJson || {});

        //console.log('/clientStart', {all, url:req.url, query: url.query, body:req.bodyJson});

        const rsvr        = all.rsvr;
        const stack       = utils.stackForRsvr(rsvr) || 'prod';
        const mainOrNext  = utils.mainOrNextForRsvr(rsvr) || 'main';

        projectId = projectId || all.projectId || all.project;

        sessionId = all.sessionId || all.session || sessionId;
        clientId  = all.clientId  || all.client  || clientId;

        if (!clientId && sessionId && sessionId.match(/^[a-z0-9_]+-[0-9]+/i)) {
          clientId = _.first(sessionId.split('-'));
        }
        who =  clientId || sessionId;

        const clientsDb   = projectId ? db.db(projectId).collection('clients')  : null;
        const sessionsDb  = projectId ? db.db(projectId).collection('sessions') : null;

        return sg.__run2([function(next, last, abort) {

          // --------------------------------------------------------------------------------------
          //
          //  Get bridge47 web-tier endpoint domain name.
          //
          //  (Get the domain name of the endpoint from the bridge47 config.)
          //  (Since bridge47 controls the web-tier, we first get the config it uses.)
          //

          var   query = {
            projectId : 'b47',
            upstream  : {$exists:true}
          };

          if (projectId === 'b47test') {
            query.projectId = projectId;
          }

          return configDb.find(query, {projection:{_id:0}}).toArray(function(err, items) {
            if (!sg.ok(err, items)) { console.error('find', query, err); return next(); }

            return sg.__each(items, function(item, nextItem) {
              result.upstream   = deref(item, ['upstream', stack]) || result.upstream;
              result.upstreams  = sg._extend(result.upstreams, deref(item, ['upstreams', stack]) || {});

              return nextItem();
            }, next);
          });

        }, function(next, last, abort) {
          if (!projectId)     { return next(); }

          // --------------------------------------------------------------------------------------
          //
          //  Get the config from the requested project
          //
          //  (I.e. main --> blue)
          //

          const query = {
            projectId,
            mainColor: {$exists:true}
          };

          return configDb.find(query, {projection:{_id:0}}).toArray(function(err, items) {
            if (!sg.ok(err, items)) { console.error('find', query, err); return next(); }

            return sg.__each(items, function(item, nextItem) {
              const upstreams         = deref(item, ['upstreams', stack]) || {};
              var   color             = deref(item, [`${mainOrNext}Color`, stack]);

              // The system will route to the main color by default. Do not include color if it was not requested
              if (!rsvr) {
                color = null;
              }

              result.upstream         = deref(item, ['upstream', stack]) || result.upstream;
              result.upstream         = result.upstream.replace('/projectid/', `/${projectId}/`);

              // Translate 'upstream' into the actual fqdn
              item.upstreams[stack]   = sg.reduce(deref(item, ['upstreams', stack]) || {}, {}, function(m, value_, key) {
                var value = value_;

                if (value === 'upstream') {
                  value = result.upstream;
                }

                return sg.kv(m, key, _.compact([value, color]).join('/'));
              });
              result.upstreams  = sg._extend(result.upstreams, deref(item, ['upstreams', stack]) || {});

              // Update the upstream based on main/next
              result.upstream   = _.compact([result.upstream, color]).join('/');

              return nextItem();
            }, next);
          });

        }, function(next, last, abort) {
          if (!sessionsDb || !sessionId)     { return next(); }

          // ----------- Save session ----------
          var updates = {};

          setOnn(updates, '$set.clientId', clientId);

          return upsertOne(sessionsDb, {sessionId}, updates, {}, function(err, receipt) {
            if (err) { console.error('session', {sessionId, err, receipt}); }
            return next();
          });

        }, function(next, last, abort) {
          if (!clientsDb || !clientId)     { return next(); }

          // ----------- Save client ----------
          var updates = {};

          const username = deref(all, 'username');
          var   email    = deref(all, 'email');

          if (!email && username && username.match(/^.*@.+[.][a-z0-9_]+$/i)) {
            email = username;
          }

          setOnn(updates, '$set.sessionId', sessionId);
          setOnn(updates, '$set.email',     email);
          setOnn(updates, '$set.username',  username);

          who = deref(all, 'description') || deref(all, 'username') || deref(all, 'email') || who;

          return upsertOne(clientsDb, {clientId}, updates, {}, function(err, receipt) {
            if (err) { console.error('client', {clientId, err, receipt}); }
            else if (receipt) {
              who = deref(receipt, 'value.description') || deref(receipt, 'value.username') || deref(receipt, 'value.email') || who;
            }

            return next();
          });

        }], function done() {
          msg += `(${who})`;
          if (result.upstream) {
            msg += ` --> |${result.upstream}|`;
          }

          console.log(msg);
          return sg._200(req, res, result);

        }, function abort(code_, errMsg) {
          console.error(msg);
          if (errMsg)  { console.error(errMsg); }

          const code = code_ || 400;

          return sg['_'+code](req, res);
        });
      });

    });

    server.listen(port, ip, function() {
      console.log(`Listening on ${ip}:${port}`);
    });
  });
};


bootstrap = function(callback) {
  const dbAddress = process.env.SERVERASSIST_DB_IP;
  var   dbUrl     = 'mongodb://10.12.21.229:27017/'+namespace;

  var   db, config = {};

  return sg.__run([function(next) {
    if (db) { return next(); }

    return MongoClient.connect(dbUrl, function(err, db_) {
      if (!sg.ok(err, db_)) { return process.exit(2); }

      db = db_;
      return next();
    });

  }], function done() {
    return callback(null, db, config);
  });
};





main();


