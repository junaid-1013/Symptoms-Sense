import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";

import { sendEmail } from "@/helpers/reminderMailer";
import { NextRequest, NextResponse } from "next/server";
import {jwtVerify} from 'jose'
connect();

export async function POST(request: NextRequest) {
    try {

        const reqBody = await request.json();
        const { medicineName,
            dosage,
            selectedDays,
            reminderTime,
            medicineType, } = reqBody;
            if (selectedDays.length == 0) {
                return NextResponse.json({ error: "Please select atleast one day for reminder" }, { status: 400 });
    
            }
            if (reminderTime == '') {
                return NextResponse.json({ error: "Please select reminder time" }, { status: 400 });
    
            }
            if (medicineType == '') {
                return NextResponse.json({ error: "Please select medicine type" }, { status: 400 });
    
            }


        
            const newReminder = { 
                medicineName,
                dosage,
                selectedDays,
                reminderTime,
                medicineType, }; 
        
 
    const token = request.cookies.get("token")?.value; 

    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }
    
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
  
    const email=userData.email
    const username:any=userData.username
    const updatedUser = await User.findOneAndUpdate(
        { email: email },
        { $push: { reminders: newReminder } },
        { new: true }
      );
          await sendEmail({userEmail:email,medicineName,medicineType,dosage,reminderTime,selectedDays,type:0})
          return NextResponse.json({
            message: "Reminder added successfully",
            success: true,
        });
    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}





export async function PUT(request: NextRequest) {
    try {

        const reqBody = await request.json();
        const { medicineName,
            dosage,
            selectedDays,
            reminderTime,
            medicineType,
        _id } = reqBody;
      


        

        console.log(reqBody);
  // Verify the user's token from the request headers
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }
    
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
    
    const email=userData.email
    const username:any=userData.username
    
    const updatedUser = await User.findOneAndUpdate(
        { email: email },
        { $pull: { reminders: { _id: _id } } },
      );  



          await sendEmail({userEmail:email,medicineName,medicineType,dosage,reminderTime,selectedDays,type:1})
          return NextResponse.json({
            message: "Reminder removed successfully",
            success: true,
        });
    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}