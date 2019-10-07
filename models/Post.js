const mongoose = require('mongoose');
const mongooseTime = require('mongoose-timestamp');


//ReplaySchema :
const ReplaySchema = new mongoose.Schema({
    postId: {type:String, required: true},
    commentId:{type: String, required: true},
    authorId:{type: String},
    fname: { type: String},
    lname: { type: String},
    username: { type: String},
    email: { type: String},
    userImg: { type: String},
    body:{ type: String, required: true }, 
    likesCount:{ type: Number, default: 0 }
});

//comment schema:
const CommentSchema = new mongoose.Schema({
    postId:{type: String, required: true},
    authorId:{type: String},
    fname: { type: String},
    lname: { type: String},
    username: { type: String},
    email: { type: String},
    userImg: { type: String},
    body:{ type: String, required: true }, 
    likesCount:{ type: Number, default: 0 }, 
    replaysCount:{ type: Number, default: 0 },
    replays:[ReplaySchema]


});

ReplaySchema.index({'$**': 'text'});
ReplaySchema.plugin(mongooseTime);
const Replay = mongoose.model('Replay', ReplaySchema);

CommentSchema.index({'$**': 'text'});
CommentSchema.plugin(mongooseTime);
const Comment = mongoose.model('Comment', CommentSchema);

const PostSchema = new mongoose.Schema({
    parentId: { type: String, required: true },
    authorId: { type: String, required: true },
    title: { type: String, required: true },
    des: { type: String, required: true },
    body: { type: String, required: true },
    likesCount: { type: Number, required: false },
    commentsCount: { type: Number, required: false },
    comments: [CommentSchema],
    tags: { type: Array, required: false },
    imgUrl: { type: String, required: false },
    showInActivity:{ type: Number, default: 1 }

});

PostSchema.index({'$**': 'text'});
PostSchema.plugin(mongooseTime);

const Post = mongoose.model('Post', PostSchema);

const data = {post:Post, comment: Comment, replay:Replay};

module.exports = data;
