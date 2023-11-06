import { NextResponse } from "next/server";

export async function POST() {
    try {
        const response = new NextResponse();

        response.cookies.set("token", "", { httpOnly: true, expires: new Date(0) });
        response.cookies.set("token", "", { httpOnly: true, expires: new Date(0) });
        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}