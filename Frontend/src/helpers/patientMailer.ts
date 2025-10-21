import nodemailer from 'nodemailer';

export const sendEmailp = async ({ title,name, userEmail,time,  email,meeting}: any) => {
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
            subject: title,
            text: `Doctor's Name: ${name}\nDoctor's Email: ${userEmail}\nAppointment Time: ${time}\n\n${meeting}`,
        };

        const mailResponse = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${mailResponse.response}`);
        return mailResponse;
    } catch (error: any) {
        throw new Error(error.message);
    }
};