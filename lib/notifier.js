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
   * @returns {promise}
   */
  static async sendSNS(subject, message = " ", topicArn = Notifier.snsTopic) {
    return Promise.resolve(await new aws.SNS().publish({
      Message: message,
      Subject: subject,
      TopicArn: topicArn
    }).promise().catch(err => {
      console.log(err);
      Notifier.sendSystemErrorMsg("slack", err.message || JSON.stringify(err));
    }));
  }

  /**
   * Send Slack message via webhook app
   * 
   * @param {string} message Message
   * @param {string} [webhookUrl] Slack webhook url
   * @returns {promise}
   */
  static async sendSlack(message, webhookUrl = Notifier.slackUrl) {
    return Promise.resolve(await axios.post(webhookUrl, { text: message }).catch(err => {
      console.log(err);
      Notifier.sendSystemErrorMsg("sns", err.message || JSON.stringify(err));
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
      if (notifier === "all" || notifier === "sns") { promises.push(Notifier.sendSNS(Notifier.systemErrorSNS, Notifier.systemErrorMsg, message)); }
      if (notifier === "all" || notifier === "slack") { promises.push(Notifier.sendSlack(Notifier.systemErrorSlack, `${Notifier.systemErrorMsg} - ${message}`)); }
      await Promise.all(promises);
    }
    catch (e) { console.log(e); }

    return Promise.resolve();
  }
}

module.exports = Notifier;