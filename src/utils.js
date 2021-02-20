function buildSlackMessage({ start, finish, version }, { context }) {
  const { payload, ref, workflow, eventName } = context;
  const { owner, repo } = context.repo;
  const event = eventName;
  const branch = event === 'pull_request' ? payload.pull_request.head.ref : ref.replace('refs/heads/', '');

  const header = repo + (start ? ':loading:' : '');

  const blocksMap = {
    true: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${repo} :loading:`,
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
            text: 'BUILDING',
          },
        ],
      },
    ],
    false: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${repo}`,
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
            text: 'FINISHED',
          },
        ],
      },
    ],
  };

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

  return { blocks: blocksMap[start], attachments };

  // const sha = event === 'pull_request' ? payload.pull_request.head.sha : github.context.sha;

  // const referenceLink =
  //   event === 'pull_request'
  //     ? {
  //         title: 'Pull Request',
  //         value: `<${payload.pull_request.html_url} | ${payload.pull_request.title}>`,
  //         short: true,
  //       }
  //     : {
  //         title: 'Branch',
  //         value: `<https://github.com/${owner}/${repo}/commit/${sha} | ${branch}>`,
  //         short: true,
  //       };

  // return [
  //   {
  //     color,
  //     fields: [
  //       {
  //         title: 'Action',
  //         value: `<https://github.com/${owner}/${repo}/commit/${sha}/checks | ${workflow}>`,
  //         short: true,
  //       },
  //       {
  //         title: 'Status',
  //         value: status,
  //         short: true,
  //       },
  //       referenceLink,
  //       {
  //         title: 'Event',
  //         value: event,
  //         short: true,
  //       },
  //     ],
  //     footer_icon: 'https://github.githubassets.com/favicon.ico',
  //     footer: `<https://github.com/${owner}/${repo} | ${owner}/${repo}>`,
  //     ts: Math.floor(Date.now() / 1000),
  //   },
  // ];
}

module.exports.buildSlackMessage = buildSlackMessage;

function formatChannelName(channel) {
  return channel.replace(/[#@]/g, '');
}

module.exports.formatChannelName = formatChannelName;
