'use strict';

const nodemailer = require('nodemailer');

function createMailer(smtp) {
  const transport = nodemailer.createTransport({ host: smtp.host, port: smtp.port, secure: false, ignoreTLS: true });
  return {
    async send({ to, subject, text }) {
      return transport.sendMail({ from: smtp.from, to, subject, text });
    },
  };
}

module.exports = { createMailer };
