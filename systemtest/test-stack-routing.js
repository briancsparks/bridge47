
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const request                 = sg.extlibs.superagent;
const urlLib                  = require('url');

const test                    = require('ava');

const numGetJsonPlan          = 3;

var xtest = function(){}
xtest.cb = function(){}

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

test.cb('b47test main is grey', t => {
  t.plan(2 + numGetJsonPlan);

  const url = `http://b47hq.mobiledevassist.net/b47test/clientStart?rsvr=hqqa`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');

    t.truthy(echoUrl);

    if (echoUrl) {
      log(t, {echoUrl});

      const url       = urlLib.parse(echoUrl, true);
      const mainColor = _.last(_.compact(url.pathname.split('/')));

      t.is(mainColor, 'grey');
    }
    t.end();
  });

});

test.cb('b47test next is gold', t => {
  t.plan(2 + numGetJsonPlan);

  const url = `http://b47hq.mobiledevassist.net/b47test/clientStart?rsvr=hqqanext`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');

    t.truthy(echoUrl);

    if (echoUrl) {
      log(t, {echoUrl});

      const url       = urlLib.parse(echoUrl, true);
      const mainColor = _.last(_.compact(url.pathname.split('/')));

      t.is(mainColor, 'gold');
    }
    t.end();
  });

});

test.cb('echo comes from grey', t => {
  const url = `http://b47hq.mobiledevassist.net/b47test/clientStart?rsvr=hqqa`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');
    return getJson(t, `${echoUrl}/echo`, (err, body, result) => {
      log(t, {err, body, header: result.header});

      t.is(result.header['x-b47-echo-color'], 'grey');
      t.end();
    });
  });
});

test.cb('echo next comes from gold', t => {
  const url = `http://b47hq.mobiledevassist.net/b47test/clientStart?rsvr=hqqanext`;
  getJson(t, url, (err, body) => {
    const echoUrl = sg.deref(body, 'upstreams.echo');
    return getJson(t, `${echoUrl}/echo`, (err, body, result) => {
      log(t, {err, body, header: result.header});

      t.is(result.header['x-b47-echo-color'], 'gold');
      t.end();
    });
  });
});

test.cb('xapi echo comes from grey', t => {
  const url = `http://b47xapi.mobiledevassist.net/b47test/xapi/v1/echo?rsvr=hqqa`;
  getJson(t, url, (err, body, result) => {
    log(t, {err, body, header: result.header});

    t.is(result.header['x-b47-echo-color'], 'grey');
    t.end();
  });
});

test.cb('xapi echo next comes from gold', t => {
  const url = `http://b47xapi.mobiledevassist.net/b47test/xapi/v1/echo?rsvr=hqqanext`;
  getJson(t, url, (err, body, result) => {
    log(t, {err, body, header: result.header});

    t.is(result.header['x-b47-echo-color'], 'gold');
    t.end();
  });
});


// Normal, sync
xtest('foo', t => {
  t.pass();
});

// Async / await
xtest('bar', async t => {
  const bar = Promise.resolve('bar');

  t.is(await bar, 'bar');
});

// Promisified
xtest(t => {
  t.plan(1);

  return Promise.resolve(3).then(n => {
    t.is(n, 3);
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

