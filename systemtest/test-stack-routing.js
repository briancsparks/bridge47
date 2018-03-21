
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const request                 = sg.extlibs.superagent;
const urlLib                  = require('url');

const ARGV                    = sg.ARGV();

// TODO: ARGV will not work. ava does not pass along args. use env vars.
const mainColor               = ARGV.main_color || 'grey';
const nextColor               = ARGV.next_color || 'gold';
const stack                   = ARGV.stack      || 'test';

var   rsvrMain                = stack === 'test' ? 'hqqa'       : 'prod';
var   rsvrNext                = stack === 'test' ? 'hqqanext'   : 'stg';
const hqFqdn                  = stack === 'test' ? 'b47hq.mobiledevassist.net'   : 'b47hq2.mobilewebassist.net';
const xapiFqdn                = stack === 'test' ? 'b47xapi.mobiledevassist.net' : 'b47xapi2.mobilewebassist.net';

const test                    = require('ava');
console.log({stack, rsvrMain});
const numGetJsonPlan          = 3;

// Unconditional:
// t.pass('[message]');
// t.fail('[message]');
//
// Assertions:
// t.truthy(data, '[message]');
// t.falsy(data, '[message]');
// t.true(data, '[message]');
// t.false(data, '[message]');
// t.is(data, expected, '[message]');
// t.not(data, expected, '[message]');
// t.deepEqual(data, expected, '[message]');
// t.notDeepEqual(data, expected, '[message]');
// t.throws(function|promise, [error, '[message]']);
// t.notThrows(function|promise, '[message]');
// t.regex(data, regex, '[message]');
// t.notRegex(data, regex, '[message]');
// t.ifError(error, '[message]');         /* assert that error is falsy */
//
// t.skip.is(foo(), 5);

test.cb(`b47test main is ${mainColor}`, t => {
  t.plan(2 + numGetJsonPlan);

  const url = `http://${hqFqdn}/b47test/clientStart?rsvr=${rsvrMain}`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');

    t.truthy(echoUrl);

    if (echoUrl) {
      log(t, {echoUrl});

      const url       = urlLib.parse(echoUrl, true);
      const mainColor = _.last(_.compact(url.pathname.split('/')));

      t.is(mainColor, `${mainColor}`);
    }
    t.end();
  });

});

test.cb(`b47test next is ${nextColor}`, t => {
  t.plan(2 + numGetJsonPlan);

  const url = `http://${hqFqdn}/b47test/clientStart?rsvr=${rsvrNext}`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');

    t.truthy(echoUrl);

    if (echoUrl) {
      log(t, {echoUrl});

      const url       = urlLib.parse(echoUrl, true);
      const mainColor = _.last(_.compact(url.pathname.split('/')));

      t.is(mainColor, `${nextColor}`);
    }
    t.end();
  });

});

test.cb(`echo comes from ${mainColor}`, t => {
  const url = `http://${hqFqdn}/b47test/clientStart?rsvr=${rsvrMain}`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');
    return getJson(t, `${echoUrl}/echo`, (err, body, result) => {
      log(t, {err, body, header: result.header});

      t.is(result.header['x-b47-echo-color'], `${mainColor}`);
      t.end();
    });
  });
});

test.cb(`echo next comes from ${nextColor}`, t => {
  const url = `http://${hqFqdn}/b47test/clientStart?rsvr=${rsvrNext}`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');
    return getJson(t, `${echoUrl}/echo`, (err, body, result) => {
      log(t, {err, body, header: result.header});

      t.is(result.header['x-b47-echo-color'], `${nextColor}`);
      t.end();
    });
  });
});

test.cb(`xapi echo comes from ${mainColor}`, t => {
  const url = `http://${xapiFqdn}/b47test/xapi/v1/echo?rsvr=${rsvrMain}`;
  getJson(t, url, (err, body, result) => {
    log(t, {err, body, header: result.header});

    t.is(result.header['x-b47-echo-color'], `${mainColor}`);
    t.end();
  });
});

test.cb(`xapi echo next comes from ${nextColor}`, t => {
  const url = `http://${xapiFqdn}/b47test/xapi/v1/echo?rsvr=${rsvrNext}`;
  getJson(t, url, (err, body, result) => {
    log(t, {err, body, header: result.header});

    t.is(result.header['x-b47-echo-color'], `${nextColor}`);
    t.end();
  });
});


function log(t, arg1, ...args) {
  _.each(arg1, (value, key) => {
    t.log(`${key}: ${sg.inspect(value)}`);
  });

  _.each(args, arg => {
    t.log(sg.inspect(arg));
  });
}

function getJson(t, url, callback) {
  return request.get(url).end((err, result) => {
    log(t, {url, err, ok: result && result.ok});

    t.truthy(sg.ok(err, result));
    t.truthy(result.ok);
    t.truthy(result.body);

    const isOk = (sg.ok(err, result) && result.ok && result.body);
    return callback(err || !isOk, result.body, result);
  });
}

