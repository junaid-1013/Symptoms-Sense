import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

connect()


export async function POST(request: NextRequest) {

    try {
        const reqBody = await request.json()
        const {email, password } = reqBody;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }
        

        //check if user exists
        const user = await User.findOne({email})

        if (!user) {
            console.log("User does not exists");
            return NextResponse.json({ error: "User does not exists" }, { status: 400 })
        }
        console.log("user exists");

        const validPassword = await bcryptjs.compare(password, user.password)
        if (!validPassword) {
            console.log("Your Password is Wrong");
            return NextResponse.json({ error: "Invalid Password" }, { status: 400 })
        }

        const tokenData = {
            id: user._id,
            username: user.username,
            email: user.email
        }

        //create token 
        const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET!, { expiresIn: "1h" })

        const response = NextResponse.json({
            message: "Login successfull",
            success: true,
        })

        response.cookies.set("token", token, {
            httpOnly: true,
        })
        return response;

    } catch (error: any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}