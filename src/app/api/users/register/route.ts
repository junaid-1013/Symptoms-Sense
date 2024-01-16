import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { sendEmail } from "@/helpers/checkMailer";

connect()


export async function POST(request: NextRequest) {

    try {
        const reqBody = await request.json()
        const { username, email, password,image } = reqBody
        const usernameRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;
        if (!usernameRegex.test(username)) {
            return NextResponse.json({ error: "Name must start with a character and may contain numbers" }, { status: 400 });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
}



const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
if (!passwordRegex.test(password)) {
    return NextResponse.json({ error: "Password must be at least 8 characters long and include at least one letter and one number." }, { status: 400 });
}



/*
        const result = await cloudinary.uploader.upload(image, {
            folder: "Users",
            // width: 300,
            // crop: "scale"
        })
    */
        const user =   await User.findOne({ username })
        const userEmail = await User.findOne({ email }) 
        if (user) {
            return NextResponse.json({ error: "Username already exists" }, { status: 400 })
        }
        if (userEmail) {
            return NextResponse.json({ error: "Email already registered" }, { status: 400 })
        }
          /*
        try{
            await sendEmail({ email})
        }
      
     catch (error:any) {
        return NextResponse.json({ error: "Email does not exist, please enter valid email address " }, { status: 400 })
      }
        */
        //hash password
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)
    
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
           
        })

        const savedUser = await newUser.save()


        return NextResponse.json({
            message: "User Created Succcessfully",
            success: true,
            savedUser
        })

    } catch (error: any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}