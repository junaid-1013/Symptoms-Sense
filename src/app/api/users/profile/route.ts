import { connect } from "@/dbConfig/dbConfig";
import {jwtVerify} from 'jose'
import { NextRequest, NextResponse } from "next/server";

import User from "@/models/userModel";
connect()
export async function GET(request: NextRequest) {
  try {
    // Verify the user's token from the request headers
    const token = request.cookies.get("token")?.value; // Assuming the token is stored in a cookie

    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }
    
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
    // Fetch user data based on the userData (e.g., email) from your database
    const email=userData.email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Return the user's data as JSON
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}