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
        if (!/^[\d\s\-]+$/.test(phone)) {
            return NextResponse.json({ error: "Please enter a valid phone number." }, { status: 400 });

        }
        if (message.trim() === "") {
            return NextResponse.json({ error: "Please enter a message." }, { status: 400 });
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