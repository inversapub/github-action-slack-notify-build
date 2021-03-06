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

    const { eventName, payload, ref } = github.context;
    const { sender, head_commit } = payload;
    const { avatar_url, login } = sender;
    const { owner, repo } = github.context.repo;
    const repoName = `${owner}/${repo}`;
    const repoUrl = `https://github.com/${repoName}`;

    const branch = eventName === 'pull_request' ? payload.pull_request.head.ref : ref.replace('refs/heads/', '');
    const shortCommit = head_commit.id.substring(0, 8);

    let newMessage;
    const re = /pull request #(\d)/;
    if (re.test(head_commit.message)) {
      const match = head_commit.message.match(re);
      const link = `<${repoUrl}/pull/${match[1]}|${match[0]}>`;
      newMessage = head_commit.message.replace(re, link);
    } else {
      newMessage = head_commit.message;
    }

    if (!channel && !core.getInput('channel_id')) {
      core.setFailed(`You must provider either a 'channel' or a 'channel_id'.`);
      return;
    }

    const channelId = core.getInput('channel_id') || (await lookUpChannelId({ slack, channel }));

    if (!channelId) {
      core.setFailed(`Slack channel ${channel} could not be found.`);
      return;
    }

    const apiMethod = messageId && messageId !== '' ? 'update' : 'postMessage';
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
        .addField(`Commit <${head_commit.url} | ${shortCommit}>`)
        .addField('Status')
        .addField(newMessage)
        .addField('BUILDING :loading:');
      m.addSection(section);

      const published = m
        .createContext()
        .addImageElement(avatar_url, login)
        .addTextElement(`Pushed on ${branch} by *${login}*`);

      m.addContext(published);

      m.addDiv();
    }

    if (finish) {
      core.info('on finish flow');
      m.channel = channelId;
      m.addHeader(github.context.repo.repo);
      m.addDiv();
      const section = m
        .createSection()
        .addField(`Commit <${head_commit.url} | ${shortCommit}>`)
        .addField('Status')
        .addField(newMessage)
        .addField(failure ? 'FAILED' : 'SUCCESS');
      m.addSection(section);

      const published = m
        .createContext()
        .addImageElement(avatar_url, login)
        .addTextElement(`Pushed on ${branch} by *${login}*`);

      m.addContext(published);

      const att = m
        .createAttachment()
        .setFooter('https://github.githubassets.com/favicon.ico', `<${repoUrl} | ${repoName}>`);

      if (failure) {
        att.addField('Image publishing failure').addField(`<${repoUrl}/actions | Check last workflow error>`);
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
