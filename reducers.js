const R = require('ramda');

const postponeMsg = R.curry((config, state, web, rtm, source, message) => {
  state.counts[message.channel] = state.counts[message.channel] || 1;
  if(state.counts[message.channel] % config.messageFrequency == 0) {
    source.onNext(message.channel);
  }
  state.counts[message.channel]++;
  return state;
});

const catchSuspiciousAddress = R.curry((config, state, web, rtm, source, message) => {
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

const channelTopicChange = R.curry((config, state, web, rtm, source, message) => {
  const configuredTopic = config.getTopicByChannel(message.channel);
  if (message.subtype === 'channel_topic'
   && message.topic !== configuredTopic) {
    console.log(message);

    web.users.info(message.user, (err, info) => {
      if (err) {
        console.error(err);
      }
      if (info.user.is_admin) {
        return;
      }
      web.channels.setTopic(message.channel, configuredTopic, function(err, info) {
        if (!err) {
          rtm.sendMessage('Please don\'t change the channel topic', message.channel);
        }
        if (err) {
          console.error(err);
        }
      });
    });
    
  }
});


module.exports = {
  postponeMsg,
  catchSuspiciousAddress,
  channelTopicChange
}
