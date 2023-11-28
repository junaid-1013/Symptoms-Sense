import { connect } from "@/dbConfig/dbConfig";
import Doctor from "@/models/doctorModel";
import { NextRequest, NextResponse } from "next/server";
import cloudinary from "@/helpers/cloudinary";

connect()

export async function GET(request: NextRequest) {
    try{
const doctors= await Doctor.find();
return new NextResponse(JSON.stringify(doctors),{status:200});
    }
    catch(error){
        return new NextResponse("Error in fetching feedbacks"+error,{status:500});
    }
}
export async function POST(request: NextRequest) {

    try {

       
        const reqBody = await request.json()
        const { name, email, phone, image,services, education, specialization,experienceYears,experienceDetails,about,img } = reqBody
        const result = await cloudinary.uploader.upload(img, {
            folder: "Doctors",
            // width: 300,
            // crop: "scale"
        })
        
        //check if user already exists
        const user = await Doctor.findOne({ email })

        if (user) {
            return NextResponse.json({ error: "Doctor already exists" }, { status: 400 })
        }

       
        const newDoctor = new Doctor({
            name,
            email,
            phone,
            image: {
                public_id: result.public_id,
                url: result.secure_url
            },
            services,education,specialization,experienceYears,experienceDetails,about
            
        })
  
        const savedDoctor = await newDoctor.save()
       



        return NextResponse.json({
            message: "Doctor added Succcessfully",
            success: true,
            savedDoctor
        })

    } catch (error: any) {
        console.log(error.message)
        return NextResponse.json({ error: error.message },
            { status: 500 })
    }
}