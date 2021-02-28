const nodemailer = require('nodemailer');

const sendEmail = async options => {
  const transport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    auth: {
      user: '3d66683f90d1f2',
      pass: '4f5178423500e3'
    }
  });

  const mailoptions = {
    from: 'Kaustubh Shukla',
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  await transport.sendMail(mailoptions);
};

module.exports = sendEmail;
