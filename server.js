const Rx = require('rx');
const R = require('ramda');

const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

const crowdsaleInfo = require('./crowdsale_info');

const bot_token = process.env.SLACK_BOT_TOKEN || '';
let state = {
  count : 1
};

const rtm = new RtmClient(bot_token);
rtm.start();

const postponeMsgReducer = R.curry((config, state, rtm, source) => {
  if(state.count % config.messageFrequency == 0) {
    source.onNext(state.count);
  }
  state.count++;
  return state;
});

const ethereumMsgReducer = R.curry((config, state, rtm, source, message) => {
    let returnMsg;

    if (/(0x)?[0-9a-f]{40}/i.test(message.text)) {
      // check if it has the basic requirements of an address
      if (message.text.includes(config.ethereumAddress)) {
        returnMsg = config.getCorrectAddressMsg(message.user);
      } else {
        returnMsg = config.getIncorrectAddressMsg(message.user);
      }

      if(message.user !== state.self.id) {
        rtm.sendMessage(returnMsg, message.channel);
      }
    }
    return state;
  });

const handleRtmMsg = R.curry((config, state, rtm, source, message) => {  
  state = postponeMsgReducer(config, state, rtm, source);
  state = ethereumMsgReducer(config, state, rtm, source, message);
});

const broadcastPostponementMsg = R.curry(function broadcastPostponementMsg(rtm, config) {
  rtm.sendMessage(config.getPostponementMsg(), config.channel);
});

const source = new Rx.Subject();

const subscription = source.subscribe(_ => broadcastPostponementMsg(rtm, crowdsaleInfo));

rtm.on(RTM_EVENTS.MESSAGE, handleRtmMsg(crowdsaleInfo, state, rtm, source));

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  state.self = rtmStartData.self;
  console.log("Chatbot Initialized");
});