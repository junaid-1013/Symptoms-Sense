import { NextResponse } from "next/server";

export async function GET() {
    try {
        const response = new NextResponse();

        // Remove the "token" cookie
        response.cookies.set("token", "", { httpOnly: true, expires: new Date(0) });

        // Send the response after the cookie is removed
       

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}