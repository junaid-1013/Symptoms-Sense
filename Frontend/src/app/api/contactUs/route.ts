import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/helpers/mailer";

export async function POST(request: NextRequest) {

    try {
        const reqBody = await request.json()
        const { name, phone, email, message } = reqBody

        if (!/^[a-zA-Z\s]+$/.test(name)) {
            return NextResponse.json({ error: "Please enter a valid name." }, { status: 400 });

        }
        
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });

        }
        if (!/^03\d{9}$/.test(phone)) {
            return NextResponse.json({ error: "Kindly input a valid phone number in the format 03XXXXXXXXX " }, { status: 400 });
          }
          if(message.length<20 || message.length>100){
            return NextResponse.json({ error: "Your Message must be between 20 and 100 characters." }, { status: 400 });
        }
    

        //send verification email
        
        await sendEmail({name, phone, email, message})

        return NextResponse.json({
            message: "Mail Sent Succcessfully",
            success: true,
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}