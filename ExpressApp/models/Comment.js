import mongoose from "mongoose";

const commentSchema = mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    text: {
        type: String, 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Comment", commentSchema);