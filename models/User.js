const mongoose = require('mongoose');
const mongooseTimeStamp = require('mongoose-timestamp');

const UserSchema = new mongoose.Schema({
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    vKey: { type: String, required: true },
    verified: { type: Number, default: 0 },
    admin: { type: Number, default: 0 },
    photoUrl: { type: String, required: false }
});

UserSchema.plugin(mongooseTimeStamp);

const User = mongoose.model('User', UserSchema);

module.exports = User;
