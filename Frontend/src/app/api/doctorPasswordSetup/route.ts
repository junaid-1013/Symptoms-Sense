import { connect } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/helpers/forgot_passMailer";
import bcryptjs from "bcryptjs";
import crypto from 'crypto';
connect()
export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json()
        const { email,url } = reqBody;        
        const resetToken = crypto.randomBytes(20).toString('hex');
        
        const resetExpires = Date.now() + 3600000;
        const user = await Doctor.findOneAndUpdate(
          { email },
          {
            $set: {
                forgotPasswordToken: resetToken,
                forgotPasswordTokenExpiry: resetExpires,
            },
          },
          { new: true }
        );
        if (!user) {
            return NextResponse.json({ error: "No user exists with the provided email address." }, { status: 400 })
        }
        const resetLink = `${url}/doctor-password-setup/?token=${resetToken}`;
        const emailText = `Thank you for registering with Symptoms Sense. We're excited to have you on board!
        To set up your account and access your dashboard, please click the following link to create a password: ${resetLink}`;
        await sendEmail({email:user.email, title:' Welcome to Symptoms Sense', emailText});
        const response = NextResponse.json({
            message: " successfull",
            success: true,
        })
        return response;
  
      } catch (error: any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}
export async function PUT(request: NextRequest) {

    try {
        const reqBody = await request.json()
        const { token,newPassword } = reqBody;
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return NextResponse.json({ error: "Password must be at least 8 characters long and include at least one letter and one number." }, { status: 400 });
        }
        const user = await Doctor.findOne({
          forgotPasswordToken: token,
          //forgotPasswordTokenExpiry: { $gt: Date.now() },
        });
        if (!user) {
            return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
        }
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(newPassword, salt);
        user.password = hashedPassword;
  
        
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpiry = undefined;
  
        await user.save();
      
        const response = NextResponse.json({
            message: "Login successfull",
            success: true,
        })
        return response;
  
      } catch (error: any) {
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
  }