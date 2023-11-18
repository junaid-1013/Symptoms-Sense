import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
        
    name: {
        type: String,
        required : [true, 'Please add name'],
    },
    email: {
        type: String,
        required : [true, 'Please add email'],
    },
    phone: {
        type: String,
        required : [true, 'Please add phone'],
    },
 
    image: {
        public_id: {
            type: String,
            required: true
        },
        url: {
            type: String,
            required: true
        }
    },
    services: {
        type: [String],
        required: true
    },
    education: {
        type: [String],
        required: true
    },
    specialization: {
        type: [String],
        required: true
    },
    experienceYears: {
        type: Number,
        required: true
    },
    experienceDetails: {
        type: [String],
        required: true
    },
    about: {
        type: String,
        required : [true, 'Please add an about'],
    },

})

const Doctor = mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default Doctor;