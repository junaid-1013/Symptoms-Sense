import nodemailer from 'nodemailer';
import { Cron,scheduledJobs } from "croner";
export const sendEmail = async ({ userEmail, medicineName, medicineType, dosage, reminderTime, selectedDays, type }: any) => {
 


  const generateJobKey = (userEmail: string, medicineName: string) => `${userEmail}_${medicineName}`;

  if (type === 0) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.MAILER_USERNAME,
          pass: process.env.MAILER_PASS,
        },
      });

      const jobKey = generateJobKey(userEmail, medicineName);
      const cronExpression = `0 ${reminderTime.split(':')[1]} ${reminderTime.split(':')[0]} * * ${selectedDays
        .map((day: string) => ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'].indexOf(day))
        .join(',')}`;

      const job = Cron(cronExpression, { name: jobKey } , () => {
        const mailOptions = {
          from: 'muzzitts56@gmail.com',
          to: userEmail,
          subject: 'Medicine Reminder',
          text: `Reminder: Take ${dosage} ${medicineType} of ${medicineName}`,
        }

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending reminder email:', error);
          } else {
            console.log('Reminder email sent:', info.response);
          }
        });
      });
      console.log(scheduledJobs)
   
   
    } catch (error: any) {
      throw new Error(error.message);
    }
  } else if (type === 1) {
    try {
      
      
      const jobKey = generateJobKey(userEmail, medicineName);
      const desiredTaskName = jobKey;
      const job = scheduledJobs.find(j => j.name === desiredTaskName);
if(job){
job.stop();

}
     
     
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
};