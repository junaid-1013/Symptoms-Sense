import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide a username"],
        unique: true,
    },
    email: {
        type: String,
        required: [true, "Please provide a email"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Please provide a password"],
        
    },
    image: {
      public_id: {
          type: String,
          
      },
      url: {
          type: String,
          
      }
  },
    isVerified: {
        type: Boolean,
        default: false,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    appointments: [
        {
          doctor:String,
          doctor_id: String,
          time: Date,
          image:String
        }
      ],
      CompletedAppointments: [
        {
          doctor:String,
          doctor_id: String,
          time: Date,
          image:String
        }
      ],
      reminders: [
        {
          medicineName: String,
          dosage: Number,
          selectedDays:[String],
          reminderTime:String,
          medicineType: String
        }
      ],
      
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
})

const User = mongoose.models.users || mongoose.model("users", userSchema);

export default User;