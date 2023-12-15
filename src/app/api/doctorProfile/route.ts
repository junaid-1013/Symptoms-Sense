import { connect } from "@/dbConfig/dbConfig";
import {jwtVerify} from 'jose'
import { NextRequest, NextResponse } from "next/server";

import User from "@/models/userModel";
import Doctor from "@/models/doctorModel";
connect()
export async function GET(request: NextRequest) {
  try {
    
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }
    
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
    const email=userData.email
    
    const user = await Doctor.findOne({ email });
    console.log(user)
    if (!user) {
      return NextResponse.json({ error: "User not found"+{email} }, { status: 404 });
    }
    
    // Return the user's data as JSON
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}