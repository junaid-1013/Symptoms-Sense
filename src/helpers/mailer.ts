import nodemailer from 'nodemailer';

export const sendEmail = async ({ name, phone, email, message }: any) => {
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
            to: "muzammiltts56@gmail.com",
            subject: "Contact Form Submission",
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
        };

        const mailResponse = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${mailResponse.response}`);
        return mailResponse;
    } catch (error: any) {
        throw new Error(error.message);
    }
};