import nodemailer from 'nodemailer';
import cron from 'node-cron';
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
      const cronExpression = `${reminderTime.split(':')[1]} ${reminderTime.split(':')[0]} * * ${selectedDays
        .map((day: string) => ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'].indexOf(day))
        .join(',')}`;

      const job = cron.schedule(cronExpression, () => {
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
      }, { name: jobKey } );
      console.log(cron.getTasks())
   
   
    } catch (error: any) {
      throw new Error(error.message);
    }
  } else if (type === 1) {
    try {
      
      
      const jobKey = generateJobKey(userEmail, medicineName);
      const desiredTaskName = jobKey;
const runningTasks = cron.getTasks();
     
      for (const [name, runningTask] of runningTasks) {
        if (name === desiredTaskName) {
          runningTask.stop()
          runningTask.removeAllListeners() 

          

        }
      }
      
      cron.getTasks().delete(jobKey)
      
      console.log(cron.getTasks())
     
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
};