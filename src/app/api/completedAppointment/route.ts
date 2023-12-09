import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Doctor from "@/models/doctorModel"

import { NextRequest, NextResponse } from "next/server";
import {jwtVerify} from 'jose'
connect();
export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { time,  doctor,doctor_id,_id } = reqBody;
        const newAppointment = { doctor:doctor,doctor_id:doctor_id, time: time }; 
        console.log(reqBody);
    const token = request.cookies.get("token")?.value; 
    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }   
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
   
    const email=userData.email
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { $pull: { appointments: { _id: _id } } },
          );  
          const updatedDoctor = await Doctor.findOneAndUpdate(
            { _id:doctor_id },
            { $pull: { appointments: { _id: _id } } },
          ); 
          const upddUser = await User.findOneAndUpdate(
            { email: email },
            { $push: { CompletedAppointments: newAppointment } },
            { new: true }
          );
          const newDocAppointment = { username:userData.username, time: time }; 
          const upddDoc = await Doctor.findOneAndUpdate(
            { _id:doctor_id },
            { $push: { CompletedAppointments: newDocAppointment } },
            { new: true }
          );
          return NextResponse.json({
            message: "User updated successfully",
            success: true,
            
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}