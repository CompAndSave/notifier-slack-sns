# Notifier - A notification system via Slack and AWS SNS

## Features
* Send message to SNS topic or Slack notification webhook
* Notification failure cross check. If SNS or Slack notification is failed to send, error notification will be sent to another channel

## Initialization
```
const AWS = require('aws-sdk');
const Notifier = require('notifier-slack-sns');

AWS.config.update({ region: YOUR_AWS_REGION });

Notifier.systemErrorSNS = YOUR_SYSTEM_ERROR_SNS_TOPIC;
Notifier.systemErrorSlack = YOUR_SYSTEM_ERROR_SLACK_URL;
Notifier.systemErrorMsg = YOUR_SYSTEM_ERROR_MESSAGE;

// Optional. But if not set, SNS topic and Slack webhook will need to be provided on every call
//
Notifier.snsTopic = YOUR_DEFAULT_SNS_TOPIC;
Notifier.slackUrl = YOUR_DEFAULT_SLACK_WEBHOOK_URL;
```

## How to Use
```
// Send SNS message
//
await sendSNS("your sns subject", "your sns message");

// Send Slack message
//
await sendSlack("your slack message");

// Send error message to both Slack and SNS
//
await Notifier.sendSystemErrorMsg("all", error.message || JSON.stringify(error));
```

## Note
1. Slack incoming webhook setup - https://api.slack.com/messaging/webhooks