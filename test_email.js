require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function test() {
    try {
        console.log("Using PASS:", process.env.EMAIL_PASS.replace(/./g, '*'));
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: 'aflah@wisc.edu',
            subject: 'Test email',
            text: 'This is a test.'
        });
        console.log("Success:", info.messageId);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
