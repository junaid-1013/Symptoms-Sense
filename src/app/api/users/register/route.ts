import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import cloudinary from "@/helpers/cloudinary";

connect()


export async function POST(request: NextRequest) {

    try {
        console.log()
        const reqBody = await request.json()
        const { username, email, password,image } = reqBody
        

        const result = await cloudinary.uploader.upload(image, {
            folder: "Users",
            // width: 300,
            // crop: "scale"
        })
        const user = await User.findOne({ email })

        if (user) {
            return NextResponse.json({ error: "User already exists" }, { status: 400 })
        }

        //hash password
        const salt = await bcryptjs.genSalt(10)
        const hashedPassword = await bcryptjs.hash(password, salt)
        console.log(result.public_id)
        console.log(result.secure_url)
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
             image: {
                public_id: result.public_id,
                url: result.secure_url
            },
        })

        const savedUser = await newUser.save()

       

        return NextResponse.json({
            message: "User Created Succcessfully",
            success: true,
            savedUser
        })

    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}