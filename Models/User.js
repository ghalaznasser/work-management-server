import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    user: { type: String, required: true, unique: true },
    isAdmin: { type: Boolean, default: false },
    imgUrl: { type: String, default: "" },
    gender: { type: String, default: "" },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    isp: { type: String, default: "" },
    timezone: { type: String, default: "" },
    country_code: { type: String, default: "" }
});

const UserModel = mongoose.model('User', userSchema, 'users');
export default UserModel;
