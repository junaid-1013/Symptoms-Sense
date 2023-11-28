import { connect } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";
import { NextRequest, NextResponse } from "next/server";
import {jwtVerify} from 'jose'

connect()

export async function GET(request: NextRequest) {
    try{
const feedbacks= await Doctor.find();
return new NextResponse(JSON.stringify(feedbacks),{status:200});
    }
    catch(error){
        return new NextResponse("Error in fetching feedbacks"+error,{status:500});
    }
}

export async function POST(request: NextRequest) {

    try {
            const token = request.cookies.get("token")?.value; 
        
            if (!token) {
              return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
            }
            const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
     const name=userData.username 
     const email=userData.email
        const reqBody = await request.json()
        const  message = reqBody.mess;
        const docName = reqBody.doctor;
        const newFeedback = { review:message,username:name,useremail:email }; 
        console.log(docName)
        const updatedDoctor = await Doctor.findOneAndUpdate(
            { name: docName },
            { $push: { feedbacks: newFeedback } },
            { new: true }
          );
          console.log('cr7')
        return NextResponse.json({
            message: "Feedback Saved Succcessfully",
            success: true,
         
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}