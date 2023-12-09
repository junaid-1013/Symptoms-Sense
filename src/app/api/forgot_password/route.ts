import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/helpers/forgot_passMailer";
import bcryptjs from "bcryptjs";
import crypto from 'crypto';
connect()


export async function POST(request: NextRequest) {

    try {
        const reqBody = await request.json()
        const { email,url } = reqBody;
  
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email=="") {
          return NextResponse.json({ error: "Kindly provide your email address to initiate the password reset process." }, { status: 400 });
      }
      
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
        }
        
  
        // Generate a unique reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        // Set the expiration time for the token ( valid for 1 hour)
        const resetExpires = Date.now() + 3600000;
        const user = await User.findOneAndUpdate(
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
        const resetLink = `${url}/reset-password/?token=${resetToken}`;
        const emailText = `Click the following link to reset your password: ${resetLink}`;
        await sendEmail({email:user.email, title:'Password Reset', emailText});
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
export async function PUT(request: NextRequest) {

  try {
      const reqBody = await request.json()
      const { token,newPassword } = reqBody;
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
      if (!passwordRegex.test(newPassword)) {
          return NextResponse.json({ error: "Password must be at least 8 characters long and include at least one letter and one number." }, { status: 400 });
      }
      const user = await User.findOne({
        forgotPasswordToken: token,
        forgotPasswordTokenExpiry: { $gt: Date.now() },
      });
      if (!user) {
          return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
      }
      const salt = await bcryptjs.genSalt(10);
      const hashedPassword = await bcryptjs.hash(newPassword, salt);
      user.password = hashedPassword;

      // Clear the reset token and expiration time
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