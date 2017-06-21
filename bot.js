const Rx = require('rx');
const R = require('ramda');

const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;

var WebClient = require('@slack/client').WebClient;

const crowdsaleInfo = require('./crowdsale_info');
const reducers = require('./reducers');

const botToken = process.env.SLACK_BOT_TOKEN || '';
const oauthToken = process.env.SLACK_BOT_OAUTH_TOKEN || '';
let state = {
  counts : {}
};

const web = new WebClient(oauthToken);
const rtm = new RtmClient(botToken);
rtm.start();

const handleRtmMsg = R.curry((config, state, web, rtm, source, message) => {  
  // state = reducers.postponeMsg(config, state, web, rtm, source, message);
  state = reducers.catchSuspiciousAddress(config, state, web, rtm, source, message);
  state = reducers.channelTopicChange(config, state, web, rtm, source, message);
});

const broadcastPostponementMsg = R.curry(function broadcastPostponementMsg(rtm, config, channel) {
  rtm.sendMessage(config.getPostponementMsg(), channel);
});

const source = new Rx.Subject();

const subscription = source.subscribe(channel => broadcastPostponementMsg(rtm, crowdsaleInfo, channel));

rtm.on(RTM_EVENTS.MESSAGE, handleRtmMsg(crowdsaleInfo, state, web, rtm, source));

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  state.self = rtmStartData.self;
  console.log("Chatbot Initialized");
});

console.log('Starting Chatbot');
