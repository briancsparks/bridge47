
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const request                 = sg.extlibs.superagent;

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;

var lib = {};


lib.log = function(t, arg1, ...args) {
  _.each(arg1, (value, key) => {
    t.log(`${key}: ${sg.inspect(value)}`);
  });

  _.each(args, arg => {
    t.log(sg.inspect(arg));
  });
}

lib. getJson = function(t, url, callback) {
  return request.get(url).end((err, result) => {
    lib.log(t, {url, err, ok: result && result.ok});

    const sgIsOk = sg.ok(err, result) || false;
    t.truthy(sgIsOk);

    const resultOk = (result && result.ok) || false;
    t.truthy(resultOk);

    const resultBody = (result && result.body) || false;
    t.truthy(resultBody);

    const isOk = (sg.ok(err, result) && result.ok && result.body);
    return callback(err || !isOk, resultBody, result || {});
  });
}


_.each(lib, (value, key) => {
  exports[key] = value;
});

