const router = require('express').Router();
const Joi = require('@hapi/joi');

const Tag = require('../models/Tag');
const Post = require('../models/Post');
const Category = require('../models/Category');

//word validate schema:
const wordSchema = new Joi.object().keys({
    content: Joi.string().min(2).required(),
});

//search by word;
router.get('', async(req, res)=>{
    const word = req.query.content;
    //data validate:
    const {error} = Joi.validate(req.query, wordSchema);
    if(error){
        return res.status(400).json({error: error.details[0].message});
    }

    //search in tags collection:
    var tags;
    var categories;
    var posts;
    try {
        tags = await Tag.find({ $text: { $search: word } }).select('_id name postsCount');
        categories = await Category.find({ $text: { $search: word } }).select('_id title des');
        posts = await Post.find({ $text: { $search: word } }).select('_id title des');

        return res.status(200).json({tags: tags, posts: posts, categories: categories});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }

});

module.exports = router;
