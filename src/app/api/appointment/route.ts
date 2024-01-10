import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Doctor from "@/models/doctorModel"
import { sendEmail } from "@/helpers/doctorMailer";
import { sendEmailp } from "@/helpers/patientMailer";
import { NextRequest, NextResponse } from "next/server";
import {jwtVerify} from 'jose'
connect();
export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { time,id,  doctor } = reqBody;
        
    const token = request.cookies.get("token")?.value; 

    if (!token) {
      return NextResponse.json({ error: "Please Login as a patient to book an appointment" }, { status: 401 });
    }
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
     const user_id = userData._id;
    const email=userData.email
    const username:any=userData.username
    const role = userData.role
    const user = await User.findOne({email})
    const doc = await Doctor.findOne({_id:id})
    let newAppointment;
    
    newAppointment = { doctor:doctor,doctor_id:id, time: time,image:doc.image.url }; 
    if(role == 'doctor'){
      return NextResponse.json({ error: "Please Login as a patient to book an appointment" }, { status: 401 });
    }
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { $push: { appointments: newAppointment } },
            { new: true }
          );
          const newAppointmentId = updatedUser.appointments[updatedUser.appointments.length - 1]._id;
          let newDocAppointment ;
          if(user.image){
             newDocAppointment = { username:username, time: time,image:user.image.url,_id:newAppointmentId, };          }
         else{
           newDocAppointment = { username:username, time: time,image:'/user.png',_id:newAppointmentId, }; 
                 }
          const updatedDoc = await Doctor.findOneAndUpdate(
            { _id:id},
            { $push: { appointments: newDocAppointment,} },
            { new: true }
          );
          const updateDoc = await Doctor.findOneAndUpdate(
            { _id:id},
            { $push: { reservations:{time:time,_id:newAppointmentId}} },
            { new: true }
          );
          const localTime = new Date(time).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
          console.log(localTime)
          //const meetingLink = `https://meet.google.com/new?name=${username.replace(/\s/g, '-')}-${doctor.replace(/\s/g, '-')}`; 
          await sendEmail({title:"Appointment Booking",name:userData.username,userEmail: userData.email,time:localTime, email:doc.email,meeting:''})
          await sendEmailp({title:"Appointment Booking",name:doc.name,userEmail: doc.email,time:localTime, email:userData.email,meeting:`Clinic Address :   ${doc.streetAddress} ${doc.city}\nPlease reach out to ${doc.phone} for assistance in case you encounter difficulties locating the clinic or have any other queries.`})
          return NextResponse.json({
            message: "User updated successfully",
            success: true,
            
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}