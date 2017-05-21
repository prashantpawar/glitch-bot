var crowdsaleInfo = require('./crowdsale_info');

var Rx = require('rx');

var RtmClient = require('@slack/client').RtmClient;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;
var RTM_CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS.RTM;

var bot_token = process.env.SLACK_BOT_TOKEN || '';

//State
const state = {
  eventEmitter: {}
};

//Reducer
function stateReducer(state, action) {
  switch(action.type) {
    case 'MSG_RECEIVED':
      return state;
    case 'PING_POSTPONEMENT':
      return state;
  }
}





//Emitter
var rtm = new RtmClient(bot_token);
rtm.start();

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  let returnMsg;
  if (/(0x)?[0-9a-f]{40}/i.test(message.text)) {
  // check if it has the basic requirements of an address
    if (message.text.includes(crowdsaleInfo.ethereum)) {
      returnMsg = `:white_check_mark: Hello <@${message.user}>! it looks like you posted the correct crowdsale address\n`;
    } else {
      returnMsg =  `Hey <@${message.user}>, it looks like you posted an ethereum address, but this is not the right crowdsale address, the correct address is ${crowdsaleInfo.ethereum}\n`;
    }
    rtm.sendMessage(returnMsg, message.channel);
  }
  console.log(message);
});

var channel = "C5ERPH14H"; //could also be a channel, group, DM, or user ID (C1234), or a username (@don)

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage(message) {
  if (message.text === "Hello.") {
    rtm.sendMessage("Hello <@" + message.user + ">!", message.channel);
  }
});