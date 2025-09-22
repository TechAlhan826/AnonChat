import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please Provide a Username !"],
        unique: true
    },
    email: {
        type: String,
        required: [true, "Please Provide a Email Id !"],
        unique: true,
    },
    password: {
        type: String,
        required: [true, "Please Provide a Password !"],
    },
    isVerified: {
        type: Boolean,
        default: false, // by default not verified
    },
    isAdmin: {
        type: Boolean,
        default: false, // by default not verified
    },
    passwordResetToken: String,
    passwordResetTokenExpiry: Date,
    registerToken: String,
    registerTokenExpiry: Date,
    
});

const users = mongoose.models.users || mongoose.model("users", userSchema);

export default users;