import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import Doctor from "@/models/doctorModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";

connect()


export async function POST(request: NextRequest) {

    try {
        const reqBody = await request.json()
        const {email, password,role } = reqBody;
        if(email==""){
            return NextResponse.json({ error: "Please provide the email address for logging in. " }, { status: 400 });
        }
        if(password==""){
            return NextResponse.json({ error: "Please provide the password for logging in." }, { status: 400 });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }
        
if(role=='patient'){
        //check if user exists
        const user = await User.findOne({email})

        if (!user) {
            console.log("User does not exists");
            return NextResponse.json({ error: "No user exists with the provided email address." }, { status: 400 })
        }
     

        const validPassword = await bcryptjs.compare(password, user.password)
        if (!validPassword) {
           
            return NextResponse.json({ error: "The entered password is incorrect. Please provide the correct password." }, { status: 400 })
        }
        const tokenData = {
            id: user._id,
            username: user.username,
            email: user.email,
            role:role
        }
        const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET!, { expiresIn: "2h" })
        const response = NextResponse.json({
            message: "Login successfull",
            success: true,
        })

        response.cookies.set("token", token, {
            httpOnly: true,
        })
        return response;
    }
    else if(role=='doctor'){
        const user = await Doctor.findOne({email})

        if (!user) {
            return NextResponse.json({ error: "No doctor exists with the provided email address." }, { status: 400 })
        }
        if(!user.password){
            return NextResponse.json({ error: "Your password has not been configured yet. Please proceed to set up your password by following the link provided in the email in order to log in." }, { status: 400 })

        }

        const validPassword = await bcryptjs.compare(password, user.password)
        if (!validPassword) {
            return NextResponse.json({ error: "The entered password is incorrect. Please provide the correct password." }, { status: 400 })
        }
        const tokenData = {
            id: user._id,
            username: user.name,
            email: user.email,
            role:role
        }
        const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET!, { expiresIn: "2h" })
        const response = NextResponse.json({
            message: "Login successfull",
            success: true,
        })

        response.cookies.set("token", token, {
            httpOnly: true,
        })
        return response;
    }
    else if(role=='admin'){
        //check if user exists
       

        if (email!='muzzitts56@gmail.com') {
            console.log("User does not exists");
            return NextResponse.json({ error: "No admin exists with the provided email address." }, { status: 400 })
        }
     

        
        if (password!='admin123') {
           
            return NextResponse.json({ error: "The entered password is incorrect. Please provide the correct password." }, { status: 400 })
        }
        const tokenData = {
            id: 1,
            username: 'muzzi',
            email: email,
            role:role
        }
        const token = await jwt.sign(tokenData, process.env.TOKEN_SECRET!, { expiresIn: "2h" })
        const response = NextResponse.json({
            message: "Login successfull",
            success: true,
        })

        response.cookies.set("token", token, {
            httpOnly: true,
        })
        return response;
    }
       
        //create token 
       

       

    } catch (error: any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}