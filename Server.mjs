import express from 'express';
import bodyParser from 'body-parser';
import cron from 'node-cron';
import nodemailer from 'nodemailer';

const app = express();
const port = Number(process.env.PORT ?? 3000);

let articles = [];

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Route to handle all POST requests
app.post('*', (req, res) => {
    const newArticles = req.body.artikel.filter(article => Array.isArray(article) && article.length === 2 && article[0] && !isNaN(article[1]));
    articles = [...articles, ...newArticles];
    res.status(200).send('POST request received and logged.');
});

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: (process.env.SMTP_PORT ?? '465') === '465', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Function to send email
const sendEmail = () => {
    if (articles.length === 0) return;

    const articleSummary = articles.reduce((summary, article) => {
        const [name, count] = article;
        summary[name] = (summary[name] || 0) + parseInt(count, 10);
        return summary;
    }, {});

    let emailContent = 'Daily Article Summary:\n\n';
    for (const [name, count] of Object.entries(articleSummary)) {
        emailContent += `${name}: ${count}\n`;
    }

    const uniqueArticleCount = Object.keys(articleSummary).length;
    const currentDate = new Date().toLocaleDateString('de-DE');

    const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.MAIL_TO ?? process.env.SMTP_USER,
        subject: `Summary for ${currentDate}: ${uniqueArticleCount} unique articles`,
        text: emailContent
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
            // Clear articles after sending email
            articles = [];
        }
    });
};

// Schedule the email to be sent at 9 AM every day
cron.schedule('0 9 * * *', sendEmail);

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
