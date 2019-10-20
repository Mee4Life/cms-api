const mongoose = require('mongoose');
const mongooseTimeStamp = require('mongoose-timestamp');

const nestedCategoriesSchema = new mongoose.Schema({
    title: { type: String, required: true },
    des: { type: String, required: true },
    nestedCategories: [],
    postsCount: { type: Number, required: false },
    imgUrl: { type: String, required: false },
    parentId: { type: String, required: true},
});
nestedCategoriesSchema.plugin(mongooseTimeStamp);
const nestedCategories = mongoose.model('nestedCategories', nestedCategoriesSchema);

const categorySchema = new mongoose.Schema({
    title: { type: String, required: true },
    des: { type: String, required: true },
    nestedCategories: [],
    postsCount: { type: Number, required: false },
    imgUrl: { type: String, required: false },
    parentId: { type: String, required: false},

});

categorySchema.plugin(mongooseTimeStamp);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
