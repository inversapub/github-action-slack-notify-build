const core = require('@actions/core');
const github = require('@actions/github');
const { WebClient } = require('@slack/web-api');
const { buildSlackMessage } = require('./src/utils');
const { MessageBuilder } = require('./slack-lib');

(async () => {
  try {
    const channel = core.getInput('channel');
    const start = Boolen(core.getInput('start'));
    const finish = Boolean(core.getInput('finish'));
    const version = core.getInput('version');
    const messageId = core.getInput('message_id');
    const token = process.env.SLACK_BOT_TOKEN;
    const slack = new WebClient(token);

    if (!channel && !core.getInput('channel_id')) {
      core.setFailed(`You must provider either a 'channel' or a 'channel_id'.`);
      return;
    }

    const channelId = core.getInput('channel_id') || (await lookUpChannelId({ slack, channel }));

    if (!channelId) {
      core.setFailed(`Slack channel ${channel} could not be found.`);
      return;
    }

    const apiMethod = Boolean(messageId) ? 'update' : 'postMessage';
    core.info(`Will ${apiMethod} in slack`);

    const opts = {
      channel: channelId,
      as_user: true,
    };

    if (messageId) {
      opts.ts = messageId;
    }

    const m = new MessageBuilder(opts);

    if (start) {
      m.addHeader(github.context.repo);
      m.addDiv();
      const section = m
        .createSection()
        .addField('Event')
        .addField('Status')
        .addField('push')
        .addField('BUILDING :loading:');
      m.addSection(section);
      m.addDiv();
    }

    const message = m.message;

    core.info('header [' + start + ',' + finish + '] ' + JSON.stringify(message));

    const response = await slack.chat[apiMethod](message);

    core.setOutput('message_id', response.ts);
  } catch (error) {
    core.setFailed(error);
  }
})();

async function lookUpChannelId({ slack, channel }) {
  let result;
  const formattedChannel = formatChannelName(channel);

  // Async iteration is similar to a simple for loop.
  // Use only the first two parameters to get an async iterator.
  for await (const page of slack.paginate('conversations.list', { types: 'public_channel, private_channel' })) {
    // You can inspect each page, find your result, and stop the loop with a `break` statement
    const match = page.channels.find(c => c.name === formattedChannel);
    if (match) {
      result = match.id;
      break;
    }
  }

  return result;
}

function formatChannelName(channel) {
  return channel.replace(/[#@]/g, '');
}
