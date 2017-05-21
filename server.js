const Rx = require('rx');
const R = require('ramda');

const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

const crowdsaleInfo = require('./crowdsale_info');

const bot_token = process.env.SLACK_BOT_TOKEN || '';
let count = 1;
let self;

const channel = "C5ERPH14H"; //could also be a channel, group, DM, or user ID (C1234), or a username (@don)

const rtm = new RtmClient(bot_token);
rtm.start();

const handleRtmMsg = R.curry(function handleRtmMessage(rtm, source, message) {
  let returnMsg;
  
  if(count % 25 == 0) {
    source.onNext(count);
  }
  count++;
  
  if (/(0x)?[0-9a-f]{40}/i.test(message.text)) {
  // check if it has the basic requirements of an address
    if (message.text.includes(crowdsaleInfo.ethereum)) {
      returnMsg = `:white_check_mark: Hello <@${message.user}>! it looks like you posted the correct crowdsale address\n`;
    } else {
      returnMsg =  `:warning: :no_entry_sign: :skull_and_crossbones: Hey <@${message.user}>, it looks like you posted an ethereum address, but this is not the right crowdsale address, the correct address is ${crowdsaleInfo.ethereum}\n`;
    }
    
    if(message.user != self.id) {
      rtm.sendMessage(returnMsg, message.channel);
    }
  }
  console.log(message);
});

const broadcastPostponementMsg = R.curry(function broadcastPostponementMsg(rtm) {
  rtm.sendMessage(crowdsaleInfo.postponementMessage, channel);
});

const source = new Rx.Subject();

const subscription = source.subscribe(_ => broadcastPostponementMsg(rtm));

rtm.on(RTM_EVENTS.MESSAGE, handleRtmMsg(rtm, source));

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
  self = rtmStartData.self;
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`);
});