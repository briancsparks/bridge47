
/**
 *  Tests that routing to the named product is working.
 *
 *  ./systemtest/test-product-routing --main-color=color
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const request                 = sg.extlibs.superagent;
const urlLib                  = require('url');
const utils                   = require('./utils');

const ARGV                    = sg.ARGV();
const getJson                 = utils.getJson;
const log                     = utils.log;

const mainColor               = ARGV.main_color || process.env.TEST_MAINCOLOR || '';
const nextColor               = ARGV.next_color || process.env.TEST_NEXTCOLOR || '';
const product                 = ARGV.product    || process.env.TEST_PRODUCT   || 'b47test';
const service                 = ARGV.service    || process.env.TEST_SERVICE   || 'echo';
//const stack                   = ARGV.stack      || process.env.TEST_STACK     || 'test';

var   rsvrMain                = 'prod';
var   rsvrNext                = 'stg';
const hqFqdn                  = 'b47hq.mobilewebassist.net';
const xapiFqdn                = 'b47xapi.mobilewebassist.net';

const test                    = require('ava');
//console.log({rsvrMain, rsvrNext, mainColor, nextColor});
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


test.cb(`hq routes to main (${mainColor})`, t => {
  t.plan(2 + numGetJsonPlan);

  const url = `http://${hqFqdn}/${product}/clientStart?rsvr=${rsvrMain}`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, `upstreams.${service}`);

    t.truthy(echoUrl);

    if (echoUrl) {

      const url             = urlLib.parse(echoUrl, true);
      const foundMainColor  = _.last(_.compact(url.pathname.split('/')));

      log(t, {echoUrl, mainColor, foundMainColor});

      t.is(foundMainColor, `${mainColor}`);
    }
    t.end();
  });

});



