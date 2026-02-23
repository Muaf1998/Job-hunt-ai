const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendResumeEmail(toEmail) {
    try {
        console.log('Current working directory:', process.cwd());
        const resumePath = path.resolve(process.cwd(), 'public', 'documents', 'Aflah,Muhammed_AI.pdf');
        console.log('Resume path:', resumePath);

        if (!fs.existsSync(resumePath)) {
            console.error('❌ Resume file not found at:', resumePath);
            return { success: false, error: "Resume file not found on server." };
        }

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: "Resume of Muhammed Aflah - TEST",
            text: `Hello,\n\nThis is a test email.\n\nBest regards,\nMosaic (AI Assistant)`,
            attachments: [
                {
                    filename: 'Muhammed_Aflah_Resume.pdf',
                    path: resumePath
                }
            ]
        };

        console.log('Sending email...');
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 Email sent:', info.messageId);
        return { success: true };

    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: "Failed to send email." };
    }
}

// execute
(async () => {
    if (!process.env.EMAIL_USER) {
        console.error("Missing EMAIL_USER");
        return;
    }
    console.log(`Testing email from ${process.env.EMAIL_USER} to ${process.env.EMAIL_USER}`);
    await sendResumeEmail(process.env.EMAIL_USER);
})();
