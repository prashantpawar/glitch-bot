const Rx = require('rx');
const R = require('ramda');

const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var WebClient = require('@slack/client').WebClient;

const crowdsaleInfo = require('./crowdsale_info');

const botToken = process.env.SLACK_BOT_TOKEN || '';
const oauthToken = process.env.SLACK_BOT_OAUTH_TOKEN || '';
let state = {
  counts : {}
};

const web = new WebClient(oauthToken);
const rtm = new RtmClient(botToken);
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
    if (message.subtype != 'channel_topic') {
      if (/(0x)?[0-9a-f]{40}/i.test(message.text)
         || /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/i.test(message.text)) {
        if(message.user !== state.self.id) {
          rtm.sendMessage(config.getSuspiciousAddressMsg(), message.channel);
        }
      }
    }
    return state;
  });
  

const channelTopicChangeReducer = R.curry((config, state, rtm, source, message) => {
  console.log("MESSAGE:", message, state.self.id);
  const configuredTopic = config.getTopicByChannel(message.channel);
  if (message.subtype === 'channel_topic'
   && message.topic !== configuredTopic) {
    //console.log("topic changed", message, message.channel);
    
    web.channels.setTopic(message.channel, configuredTopic, function(err, info) {
       if (!err) {
        rtm.sendMessage('Please don\'t change the channel topic', message.channel);
       }
      if (err) {
        console.error(err);
      }
    });
  }
});

const handleRtmMsg = R.curry((config, state, rtm, source, message) => {  
  state = postponeMsgReducer(config, state, rtm, source, message);
  state = genericAddressCatchingReducer(config, state, rtm, source, message);
  state = channelTopicChangeReducer(config, state, rtm, source, message);
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

console.log('Starting Chatbot');