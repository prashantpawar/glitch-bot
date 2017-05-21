var config= {
  "channel": "C5ERPH14H",
  "ethereumAddress": "0x960b236a07cf122663c4303350609a66a7b288c0",
  "bitcoinAddress": "1edfgadsfgretetretet4",
  "getPostponementMsg": _ => ("Please note that Tezos crowdsale which was scheduled for May 22 has been postponed to a further date in June"),
  "getCorrectAddressMsg": user => (`:white_check_mark: Hello <@${user}>! it looks like you posted the correct crowdsale address\n`),
  "getIncorrectAddressMsg": user => (`:warning: :no_entry_sign: :skull_and_crossbones: Hey <@${user}>, it looks like you posted an ethereum address, but this is not the right crowdsale address, the correct address is ${config.ethereumAddress}\n`),
  "messageFrequency" : 25
};

module.exports = config;