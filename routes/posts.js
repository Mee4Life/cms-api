const router = require('express').Router();
const tokenValidate = require('../token_validate');
const Joi = require('@hapi/joi');
const fs = require('fs');

const Post = require('../models/Post').post;
const Comment = require('../models/Post').comment;
const Replay = require('../models/Post').replay;
const User = require('../models/User').user;

//data validate :
const valPost = new Joi.object().keys({
    parentId: Joi.string().alphanum().min(5).required(),
    title: Joi.string().required(),
    des: Joi.string().required(),
    body: Joi.string().required(),
    showInActivity:Joi.number().default(1),
    comments:Joi.array()

});
//TODO add the comment and replay validate

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

//get latest posts:
router.get('/last', async (req, res) => {
    try {
        const posts = await Post.find({ showInActivity: 1 }).limit(10).sort({updatedAt: -1});
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

//get all posts:
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find();
        return res.status(200).json(posts);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

//get post by id:
router.get('/id', async(req, res)=>{
    // check if the post id in the request:
    if(!req.query.id){
        res.status(400).json({error: 'add the post id in the request'});
    }
    //TODO add validate
    const postId = req.query.id;
    try {
        const targetPost = await Post.findById(postId);
        res.status(200).json(targetPost);
    } catch (error) {
        res.status(400).json({error: error.message});
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
            comments: req.body.comments,
            answers: undefined,
            tags: undefined,
            imgUrl: '/uploads/postsImg/' + fileName,
            showInActivity: req.body.showInActivity,

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
            tags: undefined,
            showInActivity: req.body.showInActivity

        });
    }

    try {
        //try to save the post obj  
        const saved = await post.save();
        return res.status(201).json({ _id: saved._id });
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }

});

//add comment:
router.post('/comment', tokenValidate, async(req, res)=>{
    const userId = req.user.id;
    const commenter = await User.findById(userId);
    const postId = req.body.postId;
    const comment = new Comment({
        postId: postId,
        authorId: commenter._id,
        fname: commenter.fname,
        lname: commenter.lname,
        username: commenter.username,
        email: commenter.email,
        userImg: commenter.photoUrl,
        body: req.body.body,
        replays: req.body.replays,
        likesCount: 0,
        replaysCount: 0 
    });

    try {
        //save the comment to the comments:
        await comment.save();
        //save the comment to the post comments array:
        const targetPost = await Post.findById(postId);
        targetPost.comments.push(comment);
        //increase the post comments counter:
        targetPost.commentsCount++;
        await targetPost.save();
        //save the comment to the user comments array:
        commenter.comments.push(comment);
        //increase the user comments counter:
        commenter.commentsCount++;
        await commenter.save();
        return res.status(200).json({_id: comment._id});
    } catch (error) {
        console.log(comment);
        return res.status(400).json({error: error.message});
    }
});

//add replay:
router.post('/replay', tokenValidate, async(req, res)=>{
    const userId = req.user.id;
    const commenter = await User.findById(userId);
    const postId = req.body.postId;
    
    //create replay obj
    const replay = new Replay({
        postId: postId,
        commentId: req.body.commentId,
        authorId: commenter._id,
        fname: commenter.fname,
        lname: commenter.lname,
        username: commenter.username,
        email: commenter.email,
        userImg: commenter.photoUrl,
        body: req.body.body,
        likesCount: 0
    });

    try {
        // save the replay to replay doc
        await replay.save();

        // save replay to post comments replays array:
        const post = await Post.findById(replay.postId);
        // get comment by comment id:
        comment = post.comments.find(function(comment){
            return comment._id == replay.commentId
        });
        //push replay to the post comment replays array:
        comment.replays.push(replay);
        //increase the post comment replays counter:
        comment.replaysCount++;
        await post.save();

        //save replay to user comments replays array:
        // get user comment by comment id :
        userComment = commenter.comments.find(function(comment){
            return comment._id == replay.commentId
        });
        //push replay to the post comment replays array:
        userComment.replays.push(replay);
        //increase the user comment replays counter:
        userComment.replaysCount++;
        await commenter.save();

        //send the res:
        return res.status(200).json({_id: replay._id});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
    
});

//get post comments:
router.get('/comments', async(req, res)=>{
    //check if post id in the query
    if(!req.query.postId){
        return res.status(400).json({error: 'add post Id in the request'});
    }

    try {
        const post = await Post.findById(req.query.postId);
        return res.status(200).json(post.comments);
    } catch (error) {
        return res.status(400).json({error: error.message});
    }

});

//get comment replays:
router.get('/comment/replays', async(req, res)=>{
    if(!req.query.postId || !req.query.commentId){
        return res.status(400).json({error: 'add post id and comment id in the request'});
    }
    try {
        //get post:
        const post = await Post.findById(req.query.postId);
        //get comment:
        const comment = post.comments.find(function(comment){
            return comment._id = req.query.commentId;
        });
        const replays = comment.replays;
        return res.status(200).json({replays});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//delete post comment:
router.delete('/comment', tokenValidate, async(req, res)=>{
    //check if the query has comment post id
    if(!req.query.commentId || !req.query.postId){
        return res.status(400).json({error: 'add the post id and comment id in the request'});
    }
    const commentId = req.query.commentId;
    const postId = req.query.postId;

    try {
        //remove the comment from the comments array:
        await Comment.findOneAndRemove({_id: commentId});

        //remove the replays for the target comment
        await Replay.deleteMany({commentId: req.query.commentId});

        //remove the comment from the post comments array:
        const post = await Post.findById(postId);
        //create new comments array with out the comment we need to delete 
        const comments = post.comments.filter((comment)=>{
            return comment._id != commentId
        });
        //save the new comment array
        post.comments = comments;
        //decrease the comments count after delete
        post.commentsCount--;
        //save the post after edit
        await post.save();
        //remove the comment from the user comments array:
        const user = await User.findById(req.user.id);
        //create new user comments array with out the comment we need to delete 
        const userComments = user.comments.filter((comment)=>{
            return comment._id != commentId
        });
        //save the new comment array
        user.comments = userComments;
        //decrease the comments count after delete
        user.commentsCount--;
        //save the user after edit
        await user.save();
        
        return res.status(200).json({_id: commentId});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//delete replay:
router.delete('/replay', tokenValidate, async(req, res)=>{
    //check if the request has the comment id and the post id and the replay id 
    if(!req.query.postId || !req.query.commentId || !req.query.replayId){
        return res.status(400).json({error: 'check if the post id, comment id and the replay id in the request'});
    }

    try {
        //remove the replay form the replays array:
        Replay.findOneAndRemove({_id: req.query.replayId});

        const post = await Post.findById(req.query.postId);
        const comment = post.comments.find((comment)=>{
            return comment._id == req.query.commentId;
        });
        //filter the replay array from the target replay:
        const replays = comment.replays.filter((replay)=>{
            return replay._id != req.query.replayId;
        });
        //save the replays to the comment replays
        comment.replays = replays;
        //decrease the replays count:
        comment.replaysCount--;
        //save the post after edit:
        await post.save();

        //remove the replay from the comment replays array:
        const user = await User.findById(req.user.id);
        const userComment = user.comments.find((comment)=>{
            return comment._id == req.query.commentId;
        });
        //filter the comment replays array from the replay:
        const userReplays = userComment.replays.filter((replay)=>{
            return replay != req.query.replayId;
        });
        userComment.replays = userReplays;
        //decrease the replays count:
        userComment.replaysCount--;
        //save the user after edit:
        await user.save();
        
        return res.status(200).json({_id: req.query.replayId});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

module.exports = router;
