import { connect } from "@/dbConfig/dbConfig";

import { NextRequest, NextResponse } from "next/server";


import Doctor from "@/models/doctorModel";
connect()
export async function GET(request: NextRequest) {
  try {
    const doctors = await Doctor.find({});
    return NextResponse.json(doctors);

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
    try {
        const reqBody = await request.json()
        const { email} = reqBody
        const deletedUser = await Doctor.findOneAndDelete({ email: email});
      
      return NextResponse.json(deletedUser);
  
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }