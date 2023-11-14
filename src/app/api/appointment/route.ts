import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import {jwtVerify} from 'jose'
connect();

export async function POST(request: NextRequest) {
    try {

        const reqBody = await request.json();
        const { time,  doctor } = reqBody;
        
        const newAppointment = { doctor:doctor, time: time }; 

        console.log(reqBody);
  // Verify the user's token from the request headers
    const token = request.cookies.get("token")?.value; // Assuming the token is stored in a cookie

    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }
    
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
    // Fetch user data based on the userData (e.g., email) from your database
    const email=userData.email
        // Check if user already exists
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { $push: { appointments: newAppointment } },
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