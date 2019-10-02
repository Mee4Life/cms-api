const mongoose = require('mongoose');
const mongooseTime = require('mongoose-timestamp');

const PostSchema = new mongoose.Schema({
    parentId: { type: String, required: true },
    authorId: { type: String, required: true },
    title: { type: String, required: true },
    des: { type: String, required: true },
    body: { type: String, required: true },
    likesCount: { type: Number, required: false },
    commentsCount: { type: Number, required: false },
    comments: { type: Array, required: false },
    answers: { type: Array, required: false },
    tags: { type: Array, required: false },
    imgUrl: { type: String, required: false },
    showInActivity:{ type: Number, default: 1 }

});

PostSchema.index({'$**': 'text'});
PostSchema.plugin(mongooseTime);

const Post = mongoose.model('Post', PostSchema);

module.exports = Post;
