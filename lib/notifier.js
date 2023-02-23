'use strict';

const { SNS } = require("@aws-sdk/client-sns");
const axios = require("axios");

class Notifier {
  /**
   * @class
   * @classdesc Notification class
   */
  constructor() {}

  /**
   * Initialize the class object before using it
   * 
   * Config fields
   * - `region`: AWS region string (required) E.g., `us-west-2`
   * - `sns_topic`: SNS topic arn string
   * - `slack_api_url`: Slack webhook url
   * - `slack_channel_id`: Slack channel id (required if using sns-to-slack-publisher lambda service)
   * - `slack_sns_topic`: Arn string of SNS topic which connects to sns-to-slack-publisher lambda (required if using sns-to-slack-publisher lambda service)
   * - `error_sns_topic`: Arn string of SNS topic which is used for sending system error message
   * - `error_slack_url`: Arn string of slack webhook url which is used for sending system error message
   * - `error_msg_prefix`: Prefix of the system error message
   * 
   * @param {object} config
   * @param {string} config.region AWS region
   * @param {string} [config.sns_topic] SNS topic arn
   * @param {string} [config.slack_api_url] Slack webhook url
   * @param {string} [config.slack_channel_id] Slack channel id (required if using sns-to-slack-publisher lambda service)
   * @param {string} [config.slack_sns_topic] Arn string of SNS topic which connects to sns-to-slack-publisher lambda (required if using sns-to-slack-publisher lambda service)
   * @param {string} [config.error_sns_topic] Arn string of SNS topic which is used for sending system error message
   * @param {string} [config.error_slack_url] Arn string of slack webhook url which is used for sending system error message
   * @param {string} [config.error_msg_prefix] Prefix of the system error message
   */
  static initialize({
    region, sns_topic, slack_api_url,
    slack_channel_id, slack_sns_topic,
    error_sns_topic, error_slack_url, error_msg_prefix
  }) {
    Notifier.awsRegion = region;
    Notifier.snsTopic = sns_topic;
    Notifier.slackUrl = slack_api_url;
    Notifier.slackChannel = slack_channel_id;
    Notifier.slackSnsTopic = slack_sns_topic;
    Notifier.systemErrorSNS = error_sns_topic;
    Notifier.systemErrorSlack = error_slack_url;
    Notifier.systemErrorMsg = error_msg_prefix;
  }

  /**
   * Send message to Slack via SNS
   * 
   * @param {string} message Message string
   * @param {string} [topicArn] Arn string of SNS topic which connects to sns-to-slack-publisher lambda 
   * @param {boolean} [skipSendError] Set true to skip call sendSystemErrorMsg when error occurs
   */
  static async snsToSlack(message, topicArn = Notifier.slackSnsTopic, skipSendError) {
    const snsMessage = typeof message !== "string" ? JSON.stringify(message) : message;

    await Notifier.sendSNS(undefined, JSON.stringify({
      channel: Notifier.slackChannel,
      text: snsMessage
    }), topicArn, skipSendError);
  }

  /**
   * Send SNS message
   * 
   * @param {string} subject Topic subject
   * @param {string} [message] Topic message
   * @param {string} [topicArn] Topic ARN
   * @param {boolean} [skipSendError=false] Set true to skip call sendSystemErrorMsg when error occurs
   * @returns {promise}
   */
  static async sendSNS(subject, message = " ", topicArn = Notifier.snsTopic, skipSendError = false) {
    return Promise.resolve(await new SNS({ region: Notifier.awsRegion }).publish({
      Message: message,
      Subject: subject,
      TopicArn: topicArn
    }).promise().catch(err => {
      console.log(err);
      if (!skipSendError) { Notifier.sendSystemErrorMsg("slack", errorMsgFormatter(err)); }
    }));
  }

  /**
   * Send Slack message via webhook app
   * 
   * @param {string} message Message
   * @param {string} [webhookUrl] Slack webhook url
   * @param {boolean} [skipSendError=false] Set true to skip call sendSystemErrorMsg when error occurs
   * @returns {promise}
   */
  static async sendSlack(message, webhookUrl = Notifier.slackUrl, skipSendError = false) {
    return Promise.resolve(await axios.post(webhookUrl, { text: message }).catch(err => {
      console.log(err);
      if (!skipSendError) { Notifier.sendSystemErrorMsg("sns", errorMsgFormatter(err)); }
    }));
  }

  /**
   * Send out system error message to either slack or sns
   * 
   * This function won't throw error back. All error will either stream to Cloudwatch log
   * 
   * @param {string} notifier Notifier channel. Possible values: "sns", "slack", "all"
   * @param {string} message System error message
   * @returns {promise}
   */
  static async sendSystemErrorMsg(notifier, message) {
    // stream the message to cloudwatch log
    //
    console.log(message);

    if (typeof message !== "string") { return Promise.resolve(console.log("System error message is not string")); }

    // stream all error occurred to cloudwatch log
    //
    try {
      const promises = [];
      if (Notifier.systemErrorSNS && ["all", "sns"].includes(notifier)) {
        promises.push(Notifier.sendSNS(Notifier.systemErrorMsg, message, Notifier.systemErrorSNS, true));
      }
      if (["all", "slack"].includes(notifier)) {
        const errMsg = `${Notifier.systemErrorMsg} - ${message}`;

        if (Notifier.systemErrorSlack) { promises.push(Notifier.sendSlack(errMsg, Notifier.systemErrorSlack, true)); }
        else if (Notifier.slackChannel && Notifier.slackSnsTopic) { promises.push(Notifier.snsToSlack(errMsg, undefined, true)); }
      }
      await Promise.all(promises);
    }
    catch (e) { console.log(e); }

    return Promise.resolve();
  }
}

module.exports = Notifier;

/**
 * Error Message Formatter
 * 
 * @param {object} error Error
 * @returns {string} Error message
 */
const errorMsgFormatter = (error)=> {
  const message = error.message ?? error;
  return typeof message !== "string" ? JSON.stringify(message) : message;
}