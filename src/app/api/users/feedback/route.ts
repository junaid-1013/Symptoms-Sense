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
        
            // Verify the user's token from the request headers
            const token = request.cookies.get("token")?.value; // Assuming the token is stored in a cookie
        
            if (!token) {
              return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
            }
            const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
     const name=userData.username 
     
        const reqBody = await request.json()
        const { rating, message } = reqBody

       

      
        
      
        const newFeedback = new Feedback({
         
            message:reqBody.mess,
            name:userData.username,
            
        })
        console.log(reqBody);
        console.log(newFeedback);

        try {
            const savedFeedback = await newFeedback.save()
            console.log(savedFeedback);
            // Handle successful save, if needed
          } catch (error) {
            // Handle the error, log it, or send an error response
            console.error('Error:', error);
            // Respond with an error message
          }
      
        console.log(reqBody);

        

        //send verification email
        // await sendEmail({email, emailType: "VERIFY", userId: savedUser._id})

        return NextResponse.json({
            message: "Feedback Saved Succcessfully",
            success: true,
         
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}