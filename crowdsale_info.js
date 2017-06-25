const R = require('ramda');

const config= {
  "getPostponementMsg": _ => ("Please note that Tezos fundraiser which was scheduled for May 22 has been postponed to a further date in June"),
  "getSuspiciousAddressMsg": _ => (':warning: the fundraiser hasn\'t started, do not be tricked into sending bitcoins or ether to phishers. Refer to https://www.tezos.com for official information.'),
  "messageFrequency" : 50,
  "getAdminList": _ => ([
    'U4ZH9P760', //prashantpawar on test
  ])
};

module.exports = config;
