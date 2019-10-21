const mongoose = require('mongoose');
const mongooseTime = require('mongoose-timestamp');

const TagSchema = new mongoose.Schema({
    name:{ type: String, required: true },
    postsCount:{ type: Number, default: 0 },
    postsId: []
});

TagSchema.plugin(mongooseTime);
const Tag = mongoose.model('Tag', TagSchema);

module.exports = {Tag, TagSchema};
