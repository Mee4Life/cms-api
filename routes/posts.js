const router = require('express').Router();
const tokenValidate = require('../token_validate');
const Joi = require('@hapi/joi');
const fs = require('fs');

const Post = require('../models/Post').post;
const Comment = require('../models/Post').comment;
const Replay = require('../models/Post').replay;
const User = require('../models/User').user;
const UserInfo = require('../models/User').userInfo;

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
        const posts = await Post.find({ showInActivity: 1 }).limit(10).sort({createdAt: -1});
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

    const userInfoCard = await UserInfo.findOne({id: req.user.id});

    var post;
    if (hasPhoto) {
        //create post obj with img
        post = new Post({
            parentId: req.body.parentId,
            title: req.body.title,
            des: req.body.des,
            body: req.body.body,
            likesCount: 0,
            commentsCount: 0,
            comments: req.body.comments,
            tags: undefined,
            imgUrl: '/uploads/postsImg/' + fileName,
            showInActivity: req.body.showInActivity,
            authorInfo: userInfoCard,

        });
    } else {
        //create post obj with out img
        post = new Post({
            parentId: req.body.parentId,
            title: req.body.title,
            des: req.body.des,
            body: req.body.body,
            likesCount: 0,
            commentsCount: 0,
            tags: undefined,
            showInActivity: req.body.showInActivity,
            authorInfo: userInfoCard,

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

    //check if request has the post id and the comment body:
    if(!req.body.body || !req.body.postId){
        return res.status(400).json({error: 'add the post id and the comment body in the request'})
    }

    const postId = req.body.postId;

    //get user card
    const userInfoCard = await UserInfo.findOne({id: req.user.id});

    const comment = new Comment({
        postId: postId,
        body: req.body.body,
        authorInfo: userInfoCard,

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
        return res.status(200).json({_id: comment._id, comments: targetPost.comments, commentsCount: targetPost.commentsCount});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//add replay:
router.post('/replay', tokenValidate, async(req, res)=>{
    //check if the request has the comment post ids and replay body:
    if(!req.body.postId || !req.body.body || !req.body.commentId){
        return res.status(400).json({error: 'add the post comment ids and replay body in the request'});
    }
    const userId = req.user.id;
    const commenter = await User.findById(userId);
    const postId = req.body.postId;
    
    //get user card
    const userInfoCard = await UserInfo.findOne({id: req.user.id});

    //create replay obj
    const replay = new Replay({
        postId: postId,
        commentId: req.body.commentId,
        body: req.body.body,
        authorInfo: userInfoCard,

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

        //save the replay to comment replays array:
        const commentReplays = await Comment.findById(replay.commentId);
        commentReplays.replays.push(replay);
        await commentReplays.save();

        //send the res:
        return res.status(200).json({_id: replay._id, comment: comment});
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
        
        //check if the current user is the author or admin:
        const comment = await Comment.findById(commentId);
        const user = await User.findById(req.user.id);
        if(comment.authorInfo.id != req.user.id && user.admin != 1){
            return res.status(400).json({error: 'just the author/admin can delete the comment'})
        }

        //remove the comment from the comments array:
        await comment.remove();

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
        
        return res.status(200).json({_id: commentId, commentsCount: post.commentsCount, postId: post._id, comments:post.comments});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//delete replay:
router.delete('/replay', tokenValidate, async(req, res)=>{
    //check if the request has the comment id and the post id and the replay id 
    if(!req.query.replayId){
        return res.status(400).json({error: 'check if the replay id in the request'});
    }

    try {
        const replay = await Replay.findById(req.query.replayId);

        const post = await Post.findById(replay.postId);
        const comment = post.comments.find((comment)=>{
            return comment._id == replay.commentId+'';
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
            return comment._id == replay.commentId;
        });
        //filter the comment replays array from the replay:
        const userReplays = userComment.replays.filter((replay)=>{
            return replay._id != req.query.replayId;
        });
        userComment.replays = userReplays;
        //decrease the replays count:
        userComment.replaysCount--;
        //save the user after edit:
        await user.save();

        //remove the replay form the replays array:
        await replay.remove();
        
        return res.status(200).json({_id: req.query.replayId, comment: comment});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});


// like/unlike post request:
router.post('/like', tokenValidate, async(req, res)=>{
    //check if the user has the post id in the request:
    if(!req.body.postId){
        return res.status(400).json({error: 'add the post id in the request'});
    }

    const post = await Post.findById(req.body.postId);
    var likers = post.likers;

    //check if the user already liked the post:
    var userInfoCard = likers.find((userInfoCard)=>{
       return userInfoCard.id == req.user.id;
    });
    
    //if the user already liked
    var action;
    var likersRes;
    if(userInfoCard){
        //decrease the likes count
        post.likesCount--;
        //remove the user from the likers:
        const newLikersArr = likers.filter((userInfoCard)=>{
            return userInfoCard.id != req.user.id;
        });
        post.likers = newLikersArr;
        //action dislike:
        action = 0;
        likersRes = newLikersArr;
    }else{
        //increase the likes count :
        post.likesCount++;
        //add the user to the likers:
        //get user card
        userInfoCard = await UserInfo.findOne({id: req.user.id});
        likers.push(userInfoCard);
        //action dislike:
        action = 1;
        likersRes = likers;
    }

    try {
        await post.save();
        return res.status(200).json({likesCount: post.likesCount, _id: post._id, action: action, likers: likersRes});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
    
});

//toggle comment like:
router.post('/comment/like', tokenValidate, async(req,res)=>{
    //check if the req body has the post, comment ids:
    if(!req.body.postId || !req.body.commentId){
        return res.status(400).json({error: 'add the post, comment ids'});
    }

    try {
        //TODO GET THE POST DIRECT FROM THE COMMENT NO NEED TO ADD THE POST TO THE REQUEST
        //get the comment, post, user obj:
        const comment = await Comment.findById(req.body.commentId);
        const post = await Post.findById(req.body.postId);
        const user = await User.findById(req.user.id);

        //check if the user already liked the comment:
        var userInfoCard;
        userInfoCard = comment.likers.find((userInfoCard)=>{
            return userInfoCard.id == req.user.id;
        });
        //if the user already liked
        if(userInfoCard){
            /** ----------------------------------------- */
            //decrease the likes count in the comments doc
            /** ----------------------------------------- */
            comment.likesCount--;
            //remove the user from the likers:
            const newLikersArr = comment.likers.filter((userInfoCard)=>{
                return userInfoCard.id != req.user.id;
            });
            comment.likers = newLikersArr;
            await comment.save();
            /** ----------------------------------------- */
            //decrease the likes count in the post comments doc
            /** ----------------------------------------- */
            //get the comment from the post comments array
            const postComment = post.comments.find((comment)=>{
                return comment._id == req.body.commentId;
            });
            postComment.likesCount--;
            //remove the user from the users like array:
            const postCommentLikers = postComment.likers.filter((userInfoCard)=>{
                return userInfoCard.id != req.user.id;
            });
            postComment.likers = postCommentLikers;
            //save the post after toggle:
            await post.save();
            /** ----------------------------------------- */
            //decrease the likes count in the user comments doc
            /** ----------------------------------------- */
            const userComment = user.comments.find((comment)=>{
                return comment._id == req.body.commentId;
            });
            userComment.likesCount--;
            //remove the user from the users like array:
            const userCommentLikers = userComment.likers.filter((userInfoCard)=>{
                return userInfoCard.id != req.user.id;
            });
            userComment.likers = userCommentLikers;
            //save the user after toggle:
            await user.save();
            action = 0; // dislike
        }else{
            /** ----------------------------------------- */
            //increase the likes count in the comments doc
            /** ----------------------------------------- */
            //increase the likes count in the comments doc:
            comment.likesCount++;
            //add the user to the likers:
            //get user card
            userInfoCard = await UserInfo.findOne({id: req.user.id});
            comment.likers.push(userInfoCard);
            await comment.save();
            /** ----------------------------------------- */
            //increase the likes count in the post comments doc
            /** ----------------------------------------- */
            const postComment = post.comments.find((comment)=>{
                return comment._id == req.body.commentId;
            });
            postComment.likesCount++;
            //add the user from the users like array:
            postComment.likers.push(userInfoCard);
            //save the post after toggle:
            await post.save();
            /** ----------------------------------------- */
            //increase the likes count in the user comments doc
            /** ----------------------------------------- */
            const userComment = user.comments.find((comment)=>{
                return comment._id == req.body.commentId;
            });
            userComment.likesCount++;
            //add the user from the users like array:
            userComment.likers.push(userInfoCard);
            //save the user after toggle:
            await user.save();
            action = 1; // like
        }
        return res.status(200).json({commentId: comment._id, likesCount: comment.likesCount, action: action})
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//replay toggle like: 
router.post('/replay/like', tokenValidate, async(req, res)=>{
    //check if request has the post, comment, replay ids
    if(!req.body.postId || !req.body.commentId || !req.body.replayId){
        return res.status(400).json({error: 'add the post, comment, replay ids in the request'});
    }

    try {
        //TODO GET THE POST AND THE COMMENT DIRECT FROM THE REPLAY NO NEED TO ADD IT TO THE REQUEST
        //get the post, user, comment replay obj:
        const post = await Post.findById(req.body.postId);
        const user = await User.findById(req.user.id);
        const comment = await Comment.findById(req.body.commentId);
        //post replay:
        const postReplay = post.comments.find((comment)=>{
            return comment._id == req.body.commentId
        }).replays.find((replay)=>{
            return replay._id == req.body.replayId;
        });
        // comment replay:
        const commentReplay = comment.replays.find((replay)=>{
            return replay._id == req.body.replayId;
        });
        //user replay:
        const userReplay = user.comments.find((comment)=>{
            return comment._id == req.body.commentId
        }).replays.find((replay)=>{
            return replay._id == req.body.replayId;
        });
        // replay:
        const replay = await Replay.findById(req.body.replayId);

        //check if the user already liked the replay:
        var action ;
        const userInfoCard = postReplay.likers.find((userInfoCard)=>{
            return userInfoCard.id == req.user.id;
        });
        if(userInfoCard){
            //decrease the likes count:
            postReplay.likesCount--;
            userReplay.likesCount--;
            commentReplay.likesCount--;
            replay.likesCount--;
            //remove the user card:
            const replayLikers = postReplay.likers.filter((userInfoCard)=>{
                return userInfoCard.id != req.user.id;
            });
            postReplay.likers = replayLikers;
            userReplay.likers = replayLikers;
            commentReplay.likers = replayLikers;
            replay.likers = replayLikers;
            action = 0; // dislike

        }else{
            //increase the  replay likes count
            postReplay.likesCount++;
            userReplay.likesCount++;
            commentReplay.likesCount++;
            replay.likesCount++;
            // add the user to the likers:
            //get user card
            const newUserInfoCard = await UserInfo.findOne({id: req.user.id});
            postReplay.likers.push(newUserInfoCard);
            userReplay.likers.push(newUserInfoCard);
            commentReplay.likers.push(newUserInfoCard);
            replay.likers.push(newUserInfoCard);
            action = 1; // like
        }
        
        
        await post.save();
        await comment.save();
        await user.save();
        await replay.save();

        return res.json({_id: replay._id, likesCount: replay.likesCount, action: action});
        

    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//get post likers:
router.get('/likers', async(req, res)=>{
    //check if the request has the post id:
    if(!req.query.postId){
        return res.status(400).json({error: 'add the post id in the request'});
    }

    try {
        const postLikers = await Post.findById(req.query.postId).select('likers likesCount');
        return res.status(200).json(postLikers);
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//get comment likers:
router.get('/comments/likers', async(req, res)=>{
    //check if the request has the comment id:
    if(!req.query.commentId){
        return res.status(400).json({error: 'add the comment id in the request'});
    }

    try {
        const commentLikers = await Comment.findById(req.query.commentId).select('likers likesCount');
        return res.status(200).json(commentLikers);
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//get replay likers:
router.get('/replays/likers', async(req, res)=>{
    //check if the request has the replay id:
    if(!req.query.replayId){
        return res.status(400).json({error: 'add the replay id in the request'});
    }

    try {
        const replayLikers = await Replay.findById(req.query.replayId).select('likers likesCount');
        return res.status(200).json(replayLikers);
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//update comment:
router.patch('/comment', tokenValidate, async(req, res)=>{
    //check if the commentId in the request:
    if(!req.body.commentId || !req.body.commentBody){
        return res.status(400).json({error: 'add the comment id in the request'});
    }
    try {
        console.log(req.body.commentId + ' comment id before update');
        //check if the author or user id admin:
        var user = await User.findById(req.user.id);
        const comment = await Comment.findById(req.body.commentId);
        const post = await Post.findById(comment.postId);
        if(user.admin != 1 && comment.authorInfo.id != user.id){
            return res.status(400).json({error: 'only the comment author or admins can update the comment'});
        }
        //update the user to the comment author:
        user = await User.findById(comment.authorInfo.id);
        //update the comment in the comments doc
        comment.body = req.body.commentBody;
        await comment.save();
        //update the comment in the user comments doc
        //find the comment in user post :
        var userComment = user.comments.find((c)=>{
            console.log(c._id+'\n'+comment._id+'\n')
            return c._id == req.body.commentId
        });
        console.log(userComment);
        var postComment = post.comments.find((c)=>{
            return c._id == req.body.commentId
        });
        //update the comment in user and post
        userComment.body = comment.body;
        postComment.body = comment.body;
        console.log(postComment.body);
        //save the post and user:
        await user.save();
        await post.save();

        return res.status(200).json({
            commentId: comment._id,
            postId: post._id,
            commentsCount: post.commentsCount,
            postComments: post.comments
        });

    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//update replay:
router.patch('/replay', tokenValidate, async(req, res)=>{
    //check if the request has the replay id, body:
    if(!req.body.replayId || !req.body.replayBody){
        return res.status(400).json({error: 'add the replay id, body to the request '});
    }

    try {
        //extract the data:
        const user = await User.findById(req.user.id);
        const replay = await Replay.findById(req.body.replayId);
        const post = await Post.findById(replay.postId);
        const comment = await Comment.findById(replay.commentId);

        //check if the user is the author or admin:
        if(replay.authorInfo.id != req.user.id && user.admin != 1){
            return res.status(400).json({error: 'only the other and the admin can update the replay'});
        }

        //update replay:

        //post:
        const postReplay = post.comments.find((comment)=>{
            return comment._id == String(replay.commentId)
        }).replays.find((r)=>{
            return r._id == String(replay._id)
        });
        postReplay.body == req.body.replayBody;
        //save post 
        await post.save();

        //user:
        const userReplay = user.comments.find((comment)=>{
            return comment._id == String(replay.commentId)
        }).replays.find((r)=>{
            return r._id == String(replay._id)
        });
        userReplay.body = req.body.replayBody;
        //save user:
        await user.save();

        //comment: 
        const commentReplay = comment.replays.find((r)=>{
            return r._id == String(replay._id)
        });
        commentReplay.body = req.body.replayBody;
        //save comment
        await comment.save();

        //replay.
        replay.body = req.body.replayBody;
        await replay.save();

        return res.status(200).json({
            _id: replay._id,
            post: post,
            comment: comment
        });
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

module.exports = router;
