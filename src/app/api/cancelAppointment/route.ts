import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Doctor from "@/models/doctorModel"
import { sendEmail } from "@/helpers/doctorMailer";
import { NextRequest, NextResponse } from "next/server";
import {jwtVerify} from 'jose'
connect();

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { time,  doctor,doctor_id,_id } = reqBody;
    const token = request.cookies.get("token")?.value; 
    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }   
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
   
    const email=userData.email
        // Check if user already exists
        const doc = await Doctor.findOne({_id:doctor_id})
        console.log(doc.appointments)
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { $pull: { appointments: { _id: _id } } },
          );  
          const updatedDoctor = await Doctor.findOneAndUpdate(
            { _id: doctor_id },
            { $pull: { appointments: { _id: _id } } },
          );  
          
          const localTime = new Date(time).toLocaleString('en-US', { timeZone: 'Asia/Karachi' })
          await sendEmail({title:"Appointment Cancelation",name:userData.username,userEmail: userData.email,time:localTime, email:doc.email,meeting:""})
          return NextResponse.json({
            message: "User updated successfully",
            success: true,
            
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}