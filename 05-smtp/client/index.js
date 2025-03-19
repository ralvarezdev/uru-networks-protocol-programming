import nodemailer from 'nodemailer';

// Create a transporter object using the default SMTP transport
let transporter = nodemailer.createTransport({
    host: 'localhost',
    port: 465,
    secure: true,
    auth: {
        user: 'user',
        pass: 'password'
    },
    tls: {
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3',
        rejectUnauthorized: false
    }
});

// Send mail with defined transport object
let info = await transporter.sendMail({
    from: '"Sender Name" <sender@example.com>', // sender address
    to: 'recipient@example.com', // list of receivers
    subject: 'Hello', // Subject line
    text: 'Hello world?', // plain text body
    html: '<b>Hello world?</b>' // html body
});

console.log('Message sent: %s', info.messageId);