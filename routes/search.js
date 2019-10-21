const router = require('express').Router();
const Joi = require('@hapi/joi');

const Tag = require('../models/Tag').Tag;
const Post = require('../models/Post').post;
const Category = require('../models/Category');

//word validate schema:
const wordSchema = new Joi.object().keys({
    content: Joi.string().min(2).required(),
});

//search by word;
router.get('', async (req, res) => {
    const word = req.query.content;
    //data validate:
    const { error } = Joi.validate(req.query, wordSchema);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    //search in tags collection:
    var tags;
    var categories;
    var posts;
    try {
        const reg = new RegExp(word, "g");
        tags = await Tag.find({
            $or: [
                { name: { $regex: reg } }
            ]
        });
        categories = await Category.find({
            $or: [
                { title: { $regex: reg } },
                { des: { $regex: reg } }
            ]
        });
        posts = await Post.find({
            $or: [
                { title: { $regex: reg } },
                { body: { $regex: reg } },
                { des: { $regex: reg } }
            ]
        })
        const data = { tags: tags, posts: posts, categories: categories };
        console.log(posts);
        return res.status(200).json(data);
    } catch (error) {
        console.log(error);
        return res.status(400).json({ error: error.message });
    }

});

//tags by char
router.get('/tags', async (req, res) => {
    const query = req.query.chars;

    if(!query || query.length < 1){
        return res.status(400).json({error: 'include chars in request'});
    }

    const chars = query.charAt(0).toUpperCase() + query.substring(1);
    try {
        //first letter capital
        const reg = new RegExp(chars, 'g');
        //original first letter case
        const reg2 = new RegExp(query, 'g');
        //find regex:
        const tags = await Tag.find({
            $or:[
                {name: {$regex: reg}},
                {name: {$regex: reg2}}
            ]
        });
        return res.status(200).json(tags);
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
})

module.exports = router;
