const core = require('@actions/core');
const github = require('@actions/github');
const { WebClient } = require('@slack/web-api');
// const { buildSlackMessage } = require('./src/utils');
const { MessageBuilder, COLORS } = require('./slack-lib');

(async () => {
  try {
    const channel = core.getInput('channel');
    const start = core.getInput('start') == 'true';
    const finish = core.getInput('finish') == 'true';
    const failure = core.getInput('failure') == 'true';
    const version = core.getInput('version');
    const messageId = core.getInput('message_id');
    const token = process.env.SLACK_BOT_TOKEN;
    const slack = new WebClient(token);

    core.info(`s: ${start}, ${typeof start}`);
    core.info(`f: ${finish}, ${typeof finish}`);

    if (!channel && !core.getInput('channel_id')) {
      core.setFailed(`You must provider either a 'channel' or a 'channel_id'.`);
      return;
    }

    const channelId = core.getInput('channel_id') || (await lookUpChannelId({ slack, channel }));

    if (!channelId) {
      core.setFailed(`Slack channel ${channel} could not be found.`);
      return;
    }

    const apiMethod = messageId && messageId !== '' ? 'postMessage' : 'postMessage';
    core.info(`Will ${apiMethod} in slack`);

    const opts = {
      as_user: true,
    };

    const m = new MessageBuilder(opts);

    if (messageId) {
      m.messageId = messageId;
    }

    if (start) {
      core.info('on start flow');
      m.channel = channelId;
      m.addHeader(github.context.repo.repo);
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

    if (finish) {
      core.info('on finish flow');
      m.channel = channelId;
      m.addHeader(github.context.repo.repo);
      m.addDiv();
      const section = m
        .createSection()
        .addField('Event')
        .addField('Status')
        .addField('push')
        .addField('SUCCESS');
      m.addSection(section);
      const att = m.createAttachment().setFooter('https://github.githubassets.com/favicon.ico', github.repository);

      if (failure) {
        att
          .addField('Image publishing failure')
          .addField('Workflow: ' + github.workflow)
          .addField('Triggered by: ' + github.actor);
        att.color = COLORS.DANGER;
      } else {
        att.addField('Successfully published version `' + version + '`');
        att.color = COLORS.SUCCESS;
      }

      m.addAttachment(att);
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
