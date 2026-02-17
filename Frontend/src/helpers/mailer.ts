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
            from: "junadi.ali101452@gmail.com",
            to: "junadi.ali101452@gmail.com",
            subject: "Contact Form Submission",
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
        };

        const mailResponse = await transporter.sendMail(mailOptions);
        return mailResponse;
    } catch (error: any) {
        throw new Error(error.message);
    }
};