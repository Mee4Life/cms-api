const router = require('express').Router();
const tokenValidate = require('../token_validate');
const Joi = require('@hapi/joi');
const fs = require('fs');

const Post = require('../models/Post');

//data validate :
const valPost = new Joi.object().keys({
    parentId: Joi.string().alphanum().min(5).required(),
    title: Joi.string().required(),
    des: Joi.string().required(),
    body: Joi.string().required()

});

const mongoIdSchema = new Joi.object().keys({
    id: Joi.string().alphanum().min(5).required()
});

//get posts by category id 
router.get('/category', async (req, res) => {
    //check the id:
    const { error } = Joi.validate(req.query, mongoIdSchema);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    try {
        const posts = await Post.find({ parentId: req.query.id });
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

//add post:
router.post('/add', tokenValidate, async (req, res) => {
    //check the data:
    const { error } = Joi.validate(req.body, valPost);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    //check if the request content img:
    var hasPhoto = false;
    var fileName;

    if (req.files) {
        hasPhoto = true;
        //check dir if exist:
        if (!fs.existsSync('./uploads/postsImg')) {
            await fs.mkdirSync('./uploads/postsImg');
        }
        //save the photo to the dir:
        const file = req.files.img;
        fileName = file.name;
        await file.mv('./uploads/postsImg/' + fileName, (error) => {
            if (error) {
                return res.status(400).json({ error: error });
            }
        });
    }

    var post;
    if (hasPhoto) {
        //create post obj with img
        post = new Post({
            parentId: req.body.parentId,
            authorId: req.user.id,
            title: req.body.title,
            des: req.body.des,
            body: req.body.body,
            likesCount: 0,
            commentsCount: 0,
            comments: undefined,
            answers: undefined,
            tags: undefined,
            imgUrl: '/uploads/postsImg/' + fileName

        });
    } else {
        //create post obj with out img
        post = new Post({
            parentId: req.body.parentId,
            authorId: req.user.id,
            title: req.body.title,
            des: req.body.des,
            body: req.body.body,
            likesCount: 0,
            commentsCount: 0,
            comments: undefined,
            answers: undefined,
            tags: undefined

        });
    }

    try {
        //try to save the post obj  
        const saved = await post.save();
        return res.status(201).json({ id: saved._id });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

});


module.exports = router;
