
/**
 *
 */
const sg                      = require('sgsg');
const _                       = sg._;
const request                 = sg.extlibs.superagent;
const raLib                   = sg.include('run-anywhere') || require('run-anywhere');

const argvGet                 = sg.argvGet;
const argvExtract             = sg.argvExtract;
const setOnn                  = sg.setOnn;
const deref                   = sg.deref;


var lib = {};

/**
 *
 *  curl -sS 'http://b47hq.mobiledevassist.net/ntl/clientStart?rsvr=hqqa' | jq '.'
 */
lib.clientStart = function() {
  var   u               = sg.prepUsage();

  var ra = raLib.adapt(arguments, (argv, context, callback) => {

    const project        = argvGet(argv, u('project,prj',  '=project', 'The project.')) || 'ntl';
    const rsvr           = argvGet(argv, u('rsvr',  '=rsvr', 'The rsvr.'));
    const stack          = argvGet(argv, u('stack',  '=stack', 'The stack.'));
    var   domainName     = argvGet(argv, u('domain-name,domain',  '=domainName', 'The domainName.')) || stack || 'mobilewebassist.net';

    if (!domainName)     { return u.sage('domainName', 'Need domainName.', callback); }
    if (!project)        { return u.sage('project', 'Need project.', callback); }

    if (domainName === 'dev' || domainName === 'test') {
      domainName = 'mobiledevassist.net';
    }

    var   result_        = {};

    var   url            = `http://b47hq.${domainName}/${project}/clientSTart`;

    if (rsvr) {
      url += '?rsvr='+rsvr;
    }

    return sg.iwrap('clientStart', callback, function(eabort) {

      return sg.__run3([function(next, enext, enag, ewarn) {
        return request.get(url).end((err, result) => {

          if (sg.ok(err, result) && result.ok && result.body) {
            result_ = result.body;
            return next();
          }
        });

      }], function() {

        return callback(null, result_);
      });
    });
  });
};


_.each(lib, (value, key) => {
  exports[key] = value;
});

