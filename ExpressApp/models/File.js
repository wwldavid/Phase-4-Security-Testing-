import mongoose from "mongoose";

const fileSchema = mongoose.Schema({
    filename: {type: String, required: true},
    path: {type: String, required: true},
    uploadedBy: String,
    department: {
        type: String,
        enum: ['hr', 'sales', 'finance'],
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('File', fileSchema);