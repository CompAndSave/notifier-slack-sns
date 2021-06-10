'use strict';

const aws = require("aws-sdk");
const axios = require("axios");

class Notifier {
  /**
   * @class
   * @classdesc Notification class
   */
  constructor() {}

  /**
   * Send SNS message
   * 
   * @param {string} subject Topic subject
   * @param {string} [message] Topic message
   * @param {string} [topicArn] Topic ARN
   * @param {boolean} [skipSendError] Set true to skip call sendSystemErrorMsg when error occurs
   * @returns {promise}
   */
  static async sendSNS(subject, message = " ", topicArn = Notifier.snsTopic, skipSendError = false) {
    return Promise.resolve(await new aws.SNS().publish({
      Message: message,
      Subject: subject,
      TopicArn: topicArn
    }).promise().catch(err => {
      console.log(err);
      if (!skipSendError) { Notifier.sendSystemErrorMsg("slack", err.message || JSON.stringify(err)); }
    }));
  }

  /**
   * Send Slack message via webhook app
   * 
   * @param {string} message Message
   * @param {string} [webhookUrl] Slack webhook url
   * @param {boolean} [skipSendError] Set true to skip call sendSystemErrorMsg when error occurs
   * @returns {promise}
   */
  static async sendSlack(message, webhookUrl = Notifier.slackUrl, skipSendError = false) {
    return Promise.resolve(await axios.post(webhookUrl, { text: message }).catch(err => {
      console.log(err);
      if (!skipSendError) { Notifier.sendSystemErrorMsg("sns", err.message || JSON.stringify(err)); }
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
      let promises = [];
      if (notifier === "all" || notifier === "sns") { promises.push(Notifier.sendSNS(Notifier.systemErrorMsg, message, Notifier.systemErrorSNS, true)); }
      if (notifier === "all" || notifier === "slack") { promises.push(Notifier.sendSlack(`${Notifier.systemErrorMsg} - ${message}`, Notifier.systemErrorSlack, true)); }
      await Promise.all(promises);
    }
    catch (e) { console.log(e); }

    return Promise.resolve();
  }
}

module.exports = Notifier;