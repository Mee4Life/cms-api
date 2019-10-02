const router = require('express').Router();
const Tag = require('../models/Tag');
const Joi = require('@hapi/joi');
const tokenValidate = require('../token_validate');

// add tag validate:
const TagVal = new Joi.object().keys({
    parentId: Joi.string().alphanum().min(5).required(),
    name: Joi.string().min(3).required(),
    postsCount: Joi.number().default(0)
});

//update tag validate:
const upTagVal = new Joi.object().keys({
    parentId: Joi.string().alphanum().min(5).optional(),
    name: Joi.string().min(3).optional(),
    postsCount: Joi.number().optional(),
    id: Joi.string().alphanum().min(5).required()
});

//add Tag:
router.post('/', tokenValidate, async(req, res)=>{
    //validate the coming data
    const {error} = Joi.validate(req.body, TagVal);
    if(error){
        return res.status(400).json({error: error.details[0].message});
    }

    // create the Tag obj
    const tag = new Tag({
        name: req.body.name,
        parentId: req.body.parentId,
        postsCount: req.body.postsCount
    });

    try {
        const saved = await tag.save();
        return res.status(201).json({id: saved._id});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
    

});

//get all tags:
router.get('/', async(req, res) =>{
    try {
        const tags = await Tag.find();
        return res.status(200).json(tags);
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//get tags by parent id:
router.get('/category', async(req, res) =>{
    const catId = req.query.id;
    try {
        const tags = await Tag.find({parentId: catId});
        return res.status(200).json(tags);
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
});

//patch tags:
router.patch('/edit', async(req, res) =>{
    //validate the req.body:
    const {error} = Joi.validate(req.body, upTagVal);
    if(error){
        return res.status(400).json({error: error.details[0].message});
    }
    const id = req.body.id;
    try {
        const tag = await Tag.findByIdAndUpdate(id, req.body);
        return res.status(200).json({id: tag._id});
    } catch (error) {
        return res.status(400).json({error: error.message});
    }
    
});

module.exports = router;
