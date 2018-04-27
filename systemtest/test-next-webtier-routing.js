
/**
 *  When deploying a new web-tier, this test script tests that the real hq
 *  server will give the new web-tier name, when asked for rsvr=stg
 *
 *  This is one of the last tests before cut-over (if not the last test.)
 */
const sg                      = require('sgsg');
const _                       = sg._;
const request                 = sg.extlibs.superagent;
const urlLib                  = require('url');
const utils                   = require('./utils');

const ARGV                    = sg.ARGV();
const getJson                 = utils.getJson;
const log                     = utils.log;

const nextColor               = ARGV.next_color || process.env.TEST_NEXTCOLOR || '';

var   rsvrNext                = 'stg';
const hqFqdn                  = 'b47hq.mobilewebassist.net';
const xapiFqdn                = 'b47xapi.mobilewebassist.net';

const test                    = require('ava');
//console.log({rsvrNext, nextColor});
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


test.cb(`hq routes to next (${nextColor}) when using b47test`, t => {
  t.plan(2 + numGetJsonPlan);

  const url = `http://${hqFqdn}/b47test/clientStart?rsvr=${rsvrNext}`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');

    t.truthy(echoUrl);

    if (echoUrl) {

      const url             = urlLib.parse(echoUrl, true);
      const foundNextColor  = _.first(_.compact(url.hostname.split('-')));

      log(t, {echoUrl, nextColor, foundNextColor});

      t.is(foundNextColor, `${nextColor}`);
    }
    t.end();
  });

});





