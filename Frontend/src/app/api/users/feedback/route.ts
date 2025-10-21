import { connect } from "@/dbConfig/dbConfig";
import Feedback from "@/models/feedbackModel";
import { NextRequest, NextResponse } from "next/server";
import {jwtVerify} from 'jose'
import User from "@/models/userModel";
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
              return NextResponse.json({ error: "Please Login as a patient to give Feedback" }, { status: 401 });
            }
            const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
     const name=userData.username 
     if (userData.role!='patient') {
        return NextResponse.json({ error: "Please Login as a patient to give Feedback" }, { status: 401 });
      }
     const user = await User.findOne({username:name})
    
     let image='' ;
console.log(user.image.url)
     if(user && user.image && user.image.url){
image = user.image.url
     }
     else{
        image='/user.png'
     }
        const reqBody = await request.json()
        if(reqBody.mess.length<10 || reqBody.mess.length>200){
            return NextResponse.json({ error: "Feedback message must be between 10 and 200 characters." }, { status: 400 });
        }
      
        const newFeedback = new Feedback({
         
            message:reqBody.mess,
            name:userData.username,
            image:image
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