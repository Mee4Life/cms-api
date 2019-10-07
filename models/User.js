const mongoose = require('mongoose');
const mongooseTimeStamp = require('mongoose-timestamp');

//user info schema
const UserInfoSchema = new mongoose.Schema({
    id:{type:String},
    fname: {type:String},
    lname: {type:String},
    email: {type:String},
    username: {type: String},
    admin: { type: Number},
    photoUrl: { type: String}
});
UserInfoSchema.plugin(mongooseTimeStamp);
const UserInfo = mongoose.model('UserInfo', UserInfoSchema);

//ReplaySchema :
const UserReplaySchema = new mongoose.Schema({
    postId: {type:String, required: true},
    commentId:{type: String, required: true},
    body:{ type: String, required: true }, 
    likesCount:{ type: Number, default: 0 },
    authorInfo: UserInfoSchema,
});
UserReplaySchema.plugin(mongooseTimeStamp);

//comment schema:
const UserCommentSchema = new mongoose.Schema({
    postId:{type: String, required: true},
    body:{ type: String, required: true }, 
    likesCount:{ type: Number, default: 0 }, 
    replaysCount:{ type: Number, default: 0 },
    replays:[UserReplaySchema],
    authorInfo: UserInfoSchema,

});
UserCommentSchema.plugin(mongooseTimeStamp);
const UserComment = mongoose.model('UserComment', UserCommentSchema);


const UserSchema = new mongoose.Schema({
    fname: { type: String, required: true },
    lname: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    vKey: { type: String, required: true },
    verified: { type: Number, default: 0 },
    admin: { type: Number, default: 0 },
    photoUrl: { type: String, required: false },
    comments:[UserCommentSchema]

});

UserSchema.plugin(mongooseTimeStamp);
const User = mongoose.model('User', UserSchema);


module.exports = {user: User, comment: UserComment, userInfo: UserInfo};
