# Notifier - A notification system via Slack and AWS SNS

## Features
* Send message to SNS topic or Slack notification webhook
* Notification failure cross check. If SNS or Slack notification is failed to send, error notification will be sent to another channel
* Supports sns-to-slack-publisher lambda service, which forwards the SNS message to designated slack channel

## Initialization
```
const Notifier = require('notifier-slack-sns');

Notifier.initialize({
  region: YOUR_AWS_REGION,
  sns_topic: YOUR_DEFAULT_SNS_TOPIC,
  slack_api_url: YOUR_DEFAULT_SLACK_WEBHOOK_URL,
  slack_channel_id: YOUR_SLACK_CHANNEL_ID,
  slack_sns_topic: YOUR_SNS_TOPIC_CONNECTED_TO_SNS_TO_SLACK_PUBLISHER,
  error_sns_topic: YOUR_SYSTEM_ERROR_SNS_TOPIC,
  error_slack_url: YOUR_SYSTEM_ERROR_SLACK_URL,
  error_msg_prefix: YOUR_SYSTEM_ERROR_MESSAGE
});
```
- `region`: AWS region string (required) E.g., `us-west-2`
- `sns_topic`: SNS topic arn string
- `slack_api_url`: Slack webhook url
- `slack_channel_id`: Slack channel id (required if using sns-to-slack-publisher lambda service)
- `slack_sns_topic`: Arn string of SNS topic which connects to sns-to-slack-publisher lambda (required if using sns-to-slack-publisher lambda service)
- `error_sns_topic`: Arn string of SNS topic which is used for sending system error message
- `error_slack_url`: Arn string of slack webhook url which is used for sending system error message
- `error_msg_prefix`: Prefix of the system error message

## How to Use
```
// Send SNS message
//
await sendSNS("your sns subject", "your sns message");

// Send Slack message
//
await sendSlack("your slack message");

// Send Slack message via SNS
//
await snsToSlack("your slack message");

// Send error message to both Slack and SNS
//
await Notifier.sendSystemErrorMsg("all", error.message || JSON.stringify(error));
```

## Note
1. Slack incoming webhook setup - https://api.slack.com/messaging/webhooks
2. In order to use `snsToSlack()`, you will need to setup your own `sns-to-slack-publisher` lambda service which can forward the SNS message to Slack channel