import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/helpers/mailer";

export async function POST(request: NextRequest) {

    try {
        const reqBody = await request.json()
        const { name, phone, email, message } = reqBody

        console.log(reqBody);

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