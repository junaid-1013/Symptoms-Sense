import { connect } from "@/dbConfig/dbConfig";

import Doctor from "@/models/doctorModel"

import { NextRequest, NextResponse } from "next/server";
import {jwtVerify} from 'jose'
connect();
export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { time } = reqBody;
       
        const token = request.cookies.get("token")?.value; 

        if (!token) {
          return NextResponse.json({ error: "Please Login as a patient to book an appointment" }, { status: 401 });
        }
        const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
         const userData =tokenData.payload
         const user_id = userData._id;
        const email=userData.email
        const updateDoc = await Doctor.findOneAndUpdate(
            { email:email},
            { $push: { reservations:{time:time}} },
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