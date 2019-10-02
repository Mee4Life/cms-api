const mongoose = require('mongoose');
const mongooseTime = require('mongoose-timestamp');

const TagSchema = new mongoose.Schema({
    name:{ type: String, required: true },
    parentId:{ type: String, required: true }, //category Id
    postsCount:{ type: Number, default: 0 }
});

TagSchema.index({'$**': 'text'});
TagSchema.plugin(mongooseTime);
const Tag = mongoose.model('Tag', TagSchema);

module.exports = Tag;
