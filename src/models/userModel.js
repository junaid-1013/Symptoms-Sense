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
        unique: true,
    },
    image: {
      public_id: {
          type: String,
          required: [true, "Please provide"]
      },
      url: {
          type: String,
          required:  [true, "Please provide"]
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
          
          doctor: String,
          time: Date,
        }
      ],
      CompletedAppointments: [
        {
          
          doctor: String,
          time: Date,
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