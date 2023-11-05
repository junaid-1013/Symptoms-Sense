import { getDataFromToken } from "@/helpers/getDataFromToken";

import { NextRequest, NextResponse } from "next/server";
import User from "@/models/userModel";
import { connect } from "@/dbConfig/dbConfig";

connect();

export async function GET(request:NextRequest){

    try {
        const token = request.cookies.get("token")?.value; // Assuming the token is stored in a cookie

    if (!token) {
      return NextResponse.json({mess:0});
    }
    else{

        return NextResponse.json({ mess: 1 });
    }
{/*
        const userId = await getDataFromToken(request);
        const user = await User.findOne({_id: userId}).select("-password");
        return NextResponse.json({
            mesaaage: "User found",
            data: user
        })

    */}
    } catch (error:any) {
        return NextResponse.json({error: error.message}, {status: 400});
    }

}