const { context } = require('@actions/github');

function buildSlackAttachments({ status, color, github }) {
  const { payload, ref, workflow, eventName } = github.context;
  const { owner, repo } = context.repo;
  const event = eventName;
  const branch = event === 'pull_request' ? payload.pull_request.head.ref : ref.replace('refs/heads/', '');

  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Build Pipeline',
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
          text: '*Service*',
        },
        {
          type: 'mrkdwn',
          text: '*Status*',
        },
        {
          type: 'mrkdwn',
          text: repo,
        },
        {
          type: 'mrkdwn',
          text: `${status} :loading:`,
        },
      ],
    },
    {
      type: 'divider',
    },
  ];

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

  return blocks;
}

module.exports.buildSlackAttachments = buildSlackAttachments;

function formatChannelName(channel) {
  return channel.replace(/[#@]/g, '');
}

module.exports.formatChannelName = formatChannelName;
