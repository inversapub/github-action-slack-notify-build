function buildSlackMessage({ start, finish, version }, { context }) {
  const { payload, ref, workflow, eventName } = context;
  const { owner, repo } = context.repo;
  const event = eventName;
  const branch = event === 'pull_request' ? payload.pull_request.head.ref : ref.replace('refs/heads/', '');

  const header = repo + (start ? ':loading:' : '');

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: header,
        emoji: true,
      },
    },
    {
      type: 'divider',
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: '*Event*',
        },
        {
          type: 'mrkdwn',
          text: '*Status*',
        },
        {
          type: 'mrkdwn',
          text: event,
        },
        {
          type: 'mrkdwn',
          text: start ? 'BUILDING' : 'FINISHED',
        },
      ],
    },
  ];

  const attachments = [];

  if (start) {
    blocks.push({
      type: 'divider',
    });
  }

  if (finish) {
    const aux = {
      color: '#00AA00',
      fields: [
        {
          value: `Successfully generated version ${version}`,
          short: true,
        },
      ],
      footer_icon: 'https://github.githubassets.com/favicon.ico',
      footer: `<https://github.com/${owner}/${repo} | ${owner}/${repo}>`,
      ts: Math.floor(Date.now() / 1000),
    };

    attachments.push(aux);
  }

  return { blocks, attachments };
}

module.exports.buildSlackMessage = buildSlackMessage;

module.exports.formatChannelName = formatChannelName;
