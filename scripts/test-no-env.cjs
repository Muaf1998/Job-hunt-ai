const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: undefined,
        pass: undefined,
    },
});

async function run() {
    try {
        console.log("sending...");
        await transporter.sendMail({
            from: 'test@example.com',
            to: 'test@example.com',
            subject: "test",
            text: "test"
        });
        console.log("sent!");
    } catch (e) {
        console.log("error:", e.message);
    }
}
run();
