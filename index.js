const core = require('@actions/core');
const github = require('@actions/github');
const { WebClient } = require('@slack/web-api');
const { buildSlackMessage, formatChannelName } = require('./src/utils');

(async () => {
  try {
    const channel = core.getInput('channel');
    const start = core.getInput('start');
    const finish = core.getInput('finish');
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

    const params = {
      start,
      finish,
      version,
    };

    const sections = buildSlackMessage(params, github);

    core.info('header [' + start + ',' + finish + '] ' + JSON.stringify(sections.blocks[0]));

    const message = {
      channel: channelId,
      blocks: sections.blocks,
      as_user: true,
    };

    if (sections.attachments.length > 0) message.attachments = sections.attachments;

    if (messageId) {
      message.ts = messageId;
    }

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
