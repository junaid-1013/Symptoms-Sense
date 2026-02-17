import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
        
    message: {
        type: String,

    },
    name: {
        type: String,
    },
image:{
    type: String
}
})

const Feedback = mongoose.models.feedback || mongoose.model("feedback", feedbackSchema);

export default Feedback;