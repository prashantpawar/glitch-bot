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

const channelTopicChange = R.curry((config, state, web, rtm, source, message) =>
  getLastChannelTopicChangeByAMod(config, state, web, message.channel)
  .then(lastTopicMsg => {
    if (message.subtype === 'channel_topic'
      && message.topic !== lastTopicMsg.topic) {

      web.users.info(message.user, (err, info) => {
        if (err) {
          console.error(err);
        }

        if (info.user.is_admin) {
          state.lastTopicMsg = message;
          return;
        }

        web.channels.setTopic(message.channel, lastTopicMsg.topic, function(err, info) {
          if (!err) {
            rtm.sendMessage('Please don\'t change the channel topic', message.channel);
          }
          if (err) {
            console.error(err);
          }
        });
      });
    }
  }));

const getLastChannelTopicChangeByAMod = R.curry((config, state, web, channel) => {
  let lastTopicMsgPromise;

  if(state.lastTopicMsg) {
    lastTopicMsgPromise = Promise.resolve(state.lastTopicMsg);
  } else {
    lastTopicMsgPromise = new Promise((fulfill, reject) => 
      web.channels.history(channel, { },
        (err, response) => {
          if(err) reject(err);
          if(!response.ok) reject (response);
          fulfill(response.messages);
        }))
    .then(R.find(el =>
      (el.type == 'message'
    && el.subtype == 'channel_topic'
    && R.contains(el.user, config.getAdminList()))))
    .catch(console.error);
  }

  return lastTopicMsgPromise;
});

module.exports = {
  postponeMsg,
  catchSuspiciousAddress,
  channelTopicChange
}
