import { connect } from "@/dbConfig/dbConfig";
import Feedback from "@/models/feedbackModel";
import { NextRequest, NextResponse } from "next/server";
import {jwtVerify} from 'jose'

connect()

export async function GET(request: NextRequest) {
    try{
const feedbacks= await Feedback.find();
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
              return NextResponse.json({ error: "Please Login to give Feedback" }, { status: 401 });
            }
            const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
     const name=userData.username 
     
        const reqBody = await request.json()
        if(reqBody.mess.length<10 || reqBody.mess.length>100){
            return NextResponse.json({ error: "Feedback message must be between 10 and 100 characters." }, { status: 400 });
        }
      
        const newFeedback = new Feedback({
         
            message:reqBody.mess,
            name:userData.username,
            
        })
        

        try {
            const savedFeedback = await newFeedback.save()
            console.log(savedFeedback);
          } catch (error) {
            console.error('Error:', error);
          }
      

        return NextResponse.json({
            message: "Feedback Saved Succcessfully",
            success: true,
         
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}