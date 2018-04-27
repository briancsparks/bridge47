
/**
 *  This is the main workhorse script to test that routing is working, and is used
 *  extensively during a deploy of a new web-tier.
 *
 *  ./systemtest/test-stack-routing
 *
 *      -- Test that, on the test stack, the `echo` service is where it whould be for main and next, when using b47test.
 *
 *  ./systemtest/test-stack-routing --stack=prod
 *
 *      -- Test that, on the prod stack, the `echo` service is where it whould be for main and next, when using b47test.
 *
 *  ./systemtest/test-stack-routing --stack=prod --hq-subdomain=b47hq --xapi-subdomain=b47xapi
 *
 *      -- Test that, on the prod stack, the `echo` service is where it whould be for main and next, when NOT using b47test.
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const request                 = sg.extlibs.superagent;
const urlLib                  = require('url');

const ARGV                    = sg.ARGV();

// TODO: ARGV will not work. ava does not pass along args. use env vars.
const mainColor               = ARGV.main_color     || process.env.TEST_MAINCOLOR     || 'grey';
const nextColor               = ARGV.next_color     || process.env.TEST_NEXTCOLOR     || 'gold';
const stack                   = ARGV.stack          || process.env.TEST_STACK         || 'test';
const hqSubdomain             = ARGV.hqSubdomain    || process.env.TEST_HQSUBDOMAIN   || stack === 'test' ? 'b47hq'   : 'b47hq2';
const xapiSubdomain           = ARGV.xapiSubdomain  || process.env.TEST_XAPISUBDOMAIN || stack === 'test' ? 'b47xapi' : 'b47xapi2';

var   rsvrMain                = stack === 'test' ? 'hqqa'                                 : 'prod';
var   rsvrNext                = stack === 'test' ? 'hqqanext'                             : 'stg';
const hqFqdn                  = stack === 'test' ? `${hqSubdomain}.mobiledevassist.net`   : `${hqSubdomain}.mobilewebassist.net`;
const xapiFqdn                = stack === 'test' ? `${xapiSubdomain}.mobiledevassist.net` : `${xapiSubdomain}.mobilewebassist.net`;

const test                    = require('ava');
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

/**
 *  Confirm that /.../clientStart tells us the right color for the main color (grey
 *  by default.)
 */
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

/**
 *  Confirm that /.../clientStart tells us the right color for the next color (gold
 *  by default.)
 */
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

/**
 *  Confirms that when /.../clientStart is called, that the web-tier is the right color.
 */
test.cb(`webtier is right color`, t => {
  const url = `http://${hqFqdn}/b47test/clientStart?rsvr=${rsvrMain}`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');
    const echoUrlObj  = urlLib.parse(echoUrl);
    const webTierColor  = (echoUrlObj.hostname.split('-')[0] || '');
    const echoWtcUrl  = `${echoUrlObj.protocol}//${echoUrlObj.hostname}/echowebtiercolor`;

    return getJson(t, echoWtcUrl, (err, body, result) => {

      const b47_color = body.B47_COLOR;
      log(t, {echoWtcUrl, b47_color, webTierColor});
      t.is(b47_color, webTierColor);
      t.end();
    });
  });
});

/**
 *  Confirm that when a request for main happens (for api), that is is served
 *  up by an instance of that color (grey by default.)
 */
test.cb(`echo comes from ${mainColor}`, t => {
  const url = `http://${hqFqdn}/b47test/clientStart?rsvr=${rsvrMain}`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');
    return getJson(t, `${echoUrl}/echo`, (err, body, result) => {
      log(t, {err, body, header: result.header});

      const headers = result.header || {};
      t.is(headers['x-b47-echo-color'], `${mainColor}`);
      t.end();
    });
  });
});

/**
 * Confirm that when a request for next happens (for api), that it is served
 * up by an instance of that color (gold by default.)
 */
test.cb(`echo next comes from ${nextColor}`, t => {
  const url = `http://${hqFqdn}/b47test/clientStart?rsvr=${rsvrNext}`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');
    return getJson(t, `${echoUrl}/echo`, (err, body, result) => {
      log(t, {err, body, header: result.header});

      const headers = result.header || {};
      t.is(headers['x-b47-echo-color'], `${nextColor}`);
      t.end();
    });
  });
});

/**
 *  Confirm that when a request for main happens (for xapi), that it is served
 *  up by an instance of that color (grey by default.)
 *
 *  Note that we do not do the /.../clientStart request first.
 */
test.cb(`xapi echo comes from ${mainColor}`, t => {
  const url = `http://${xapiFqdn}/b47test/xapi/v1/echo?rsvr=${rsvrMain}`;
  getJson(t, url, (err, body, result) => {
    log(t, {err, body, header: result.header});

    t.is(result.header['x-b47-echo-color'], `${mainColor}`);
    t.end();
  });
});

/**
 *  Confirm that when a request for next happens (for xapi), that it is served
 *  up by an instance of that color (gold by default.)
 *
 *  Note that we do not do the /.../clientStart request first.
 */
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

