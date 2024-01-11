import { connect } from "@/dbConfig/dbConfig";

import { NextRequest, NextResponse } from "next/server";

import User from "@/models/userModel";

connect()
export async function GET(request: NextRequest) {
  try {
    const users = await User.find({});
  
    return NextResponse.json(users);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
    try {
        const reqBody = await request.json()
        const { email} = reqBody
        const deletedUser = await User.findOneAndDelete({ email: email});
      
      return NextResponse.json(deletedUser);
  
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }