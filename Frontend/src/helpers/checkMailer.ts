import nodemailer from 'nodemailer';

export const sendEmail = async ({ email }: any) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.MAILER_USERNAME,
                pass: process.env.MAILER_PASS,
            },
        });

        const mailOptions = {
            from: "muzzitts56@gmail.com",
            to: email,
            subject: "Welcome to Symptoms Sense",
            text:"Welcome to Symptoms Sense! Your registration was successful. Please log in to access your profile.",
        };

        const mailResponse = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${mailResponse.response}`);
        return mailResponse;
    } catch (error: any) {
        throw new Error(error.message);
    }
};