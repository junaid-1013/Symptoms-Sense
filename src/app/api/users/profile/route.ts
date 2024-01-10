import { connect } from "@/dbConfig/dbConfig";
import {jwtVerify} from 'jose'
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/helpers/cloudinary";
import User from "@/models/userModel";
import Doctor from "@/models/userModel";
connect()
export async function GET(request: NextRequest) {
  try {
    
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }
    
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
   
    const email=userData.email
    const user = await User.findOne({ email });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Return the user's data as JSON
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function POST(request: NextRequest) {
  try {
    
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }
    
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
   
    const email=userData.email
   
    
    // Return the user's data as JSON
    return NextResponse.json(userData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
export async function PUT(request: NextRequest) {
  try {
    

    const reqBody = await request.json()
    const { img ,name} = reqBody
    const token = request.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
    }
    
    const tokenData = await jwtVerify(token, new TextEncoder().encode(process.env.TOKEN_SECRET!));
     const userData =tokenData.payload
   
    const email=userData.email
    const username = userData.username
    let uname = name;
    const user1 =   await User.findOne({ username:name })
      if (user1) {
          return NextResponse.json({ error: "Username already exists" }, { status: 400 })
      }
    if(name==''){
      
      const user2 =   await User.findOne({ email })
       uname = user2.username
    }
   
    const result = await cloudinary.uploader.upload(img, {
      folder: "Users",
      // width: 300,
      // crop: "scale"
  })

  const user = await User.findOneAndUpdate(
    { email },
    {
      $set: {
        image: { public_id: result.public_id, url: result.secure_url },
        username:uname
      },
    },
    { new: true }
  );
 

    // Return the user's data as JSON
    return NextResponse.json(userData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}