import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true,
        default: "*"
    },
    username: {
        type: String, 
        required: true, 
        unique: true
    },
    userId: {
        type: String, 
        required: true, 
        unique: true
    },
    hashPassword: {
        type: String, 
        required: true
    },
    role: {
        type: String, 
        enum: ['admin', 'employee'], 
        default: 'employee'
    },
    department: {
        type: String, 
        enum: ['hr', 'sales', 'finance'], 
        required: true
    },
});

export default mongoose.model('User', userSchema);