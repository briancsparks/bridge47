
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const { StringDecoder }       = require('string_decoder');

const ARGV                    = sg.ARGV();
const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;

var lib = {};

lib.decode = function(buffer, encoding) {
  const decoder = new StringDecoder(encoding);

  var   result  = '';

  result  = decoder.write(buffer);
  result += decoder.end();

  return result;
};

lib.parseClientCert = function(clientCryptoId) {
  return sg.reduce(clientCryptoId.split('/'), {}, function(m, v) {
    const arr = v.split('=');
    return sg.kv(m, arr[0], arr[1])
  });
};

const routingColors = 'blue,teal,pink,aqua,gold,grey,lime'.split(',');
lib.colors    = routingColors;
lib.colorsRe  = /(blue|teal|pink|aqua|gold|grey|lime)/i;

lib.colorMirror = sg.keyMirror(routingColors);

lib.matchedColor = function(str) {
  const m = lib.colorsRe.match(str);
  return m && m[1];
};

/**
 *  If str is a color, return it, otherwise undefined.
 */
lib.theColor = function(str) {
  return lib.colorMirror[str];
};

lib.stackForRsvr = function(rsvr) {
  if (sg.isnt(rsvr)) {
    return /* undefined */;
  }

  if (rsvr.startsWith('hqqa') || rsvr.startsWith('qa'))         { return 'test'; }
  if (rsvr.startsWith('hqtest') || rsvr.startsWith('test'))     { return 'test'; }
  if (rsvr.startsWith('hqstg') || rsvr.startsWith('stg'))       { return 'prod'; }
  if (rsvr.startsWith('hqext') || rsvr.startsWith('ext'))       { return 'ext'; }
  if (rsvr.startsWith('hqpub') || rsvr.startsWith('pub'))       { return 'prod'; }
  if (rsvr.startsWith('hqprod') || rsvr.startsWith('prod'))     { return 'prod'; }

  return /* undefined */;
}

lib.mainOrNextForRsvr = function(rsvr) {
  if (rsvr) {
    if (rsvr.endsWith('next'))                      { return 'next'; }
    if (rsvr === 'hqstg' || rsvr === 'stg')         { return 'next'; }
  }

  return 'main';
};


_.each(lib, (value, key) => {
  exports[key] = value;
});

