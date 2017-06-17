const Rx = require('rx');
const R = require('ramda');

const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

const crowdsaleInfo = require('./crowdsale_info');

const bot_token = process.env.SLACK_BOT_TOKEN || '';
let state = {
  counts : {}
};

const rtm = new RtmClient(bot_token);
rtm.start();

const postponeMsgReducer = R.curry((config, state, rtm, source, message) => {
  state.counts[message.channel] = state.counts[message.channel] || 1;
  if(state.counts[message.channel] % config.messageFrequency == 0) {
    source.onNext(message.channel);
  }
  state.counts[message.channel]++;
  return state;
});

const genericAddressCatchingReducer = R.curry((config, state, rtm, source, message) => {
    if (/(0x)?[0-9a-f]{40}/i.test(message.text)
       || /[13][a-km-zA-HJ-NP-Z1-9]{25,34}/i.test(message.text)) {
      if(message.user !== state.self.id) {
        rtm.sendMessage(config.getSuspiciousAddressMsg(), message.channel);
      }
    }
    return state;
  });

const handleRtmMsg = R.curry((config, state, rtm, source, message) => {  
  // state = postponeMsgReducer(config, state, rtm, source, message);
  state = genericAddressCatchingReducer(config, state, rtm, source, message);
});

const broadcastPostponementMsg = R.curry(function broadcastPostponementMsg(rtm, config, channel) {
  rtm.sendMessage(config.getPostponementMsg(), channel);
});

const source = new Rx.Subject();

const subscription = source.subscribe(channel => broadcastPostponementMsg(rtm, crowdsaleInfo, channel));

rtm.on(RTM_EVENTS.MESSAGE, handleRtmMsg(crowdsaleInfo, state, rtm, source));

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  state.self = rtmStartData.self;
  console.log("Chatbot Initialized");
});
