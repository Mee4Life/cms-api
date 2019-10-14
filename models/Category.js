const mongoose = require('mongoose');
const mongooseTimeStamp = require('mongoose-timestamp');

const categorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    des: { type: String, required: true },
    nestedCategories: { type: Array, required: false },
    postsCount: { type: Number, required: false },
    imgUrl: { type: String, required: false },
    parentId: { type: String, required: false, default: 'root'},

});

categorySchema.plugin(mongooseTimeStamp);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
