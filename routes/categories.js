const router = require('express').Router();
const Joi = require('@hapi/joi');
const tokenValidate = require('../token_validate');
var fs = require('fs');

const Category = require('../models/Category');

//Data validate Schemas 
insertCategoryVal = new Joi.object().keys({
    title: Joi.string().min(3).max(60).required(),
    des: Joi.string().min(5).required(),
    parentId: Joi.string().alphanum().min(4).allow('')
});

//get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find();
        return res.status(200).json(categories);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

//get categories by category id:
router.get('/category', async(req, res)=>{
    try {
        const categories = await Category.find({parentId: req.query.id});
        return res.status(200).json(categories);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

//get root categories :
router.get('/home', async(req, res)=>{
    try {
        const categories = await Category.find({parentId: 'root'});
        return res.status(200).json(categories);
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
});

//add category:
router.post('/add', tokenValidate, async (req, res) => {

    var hasPhoto = false;
    var fileName = '';

    const { error } = Joi.validate(req.body, insertCategoryVal);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }

    //check if the request has img inside:
    if (req.files) {
        hasPhoto = true;
        const file = req.files.img;
        fileName = file.name;
        //check if the dir is exist:
        if (!fs.existsSync('./uploads/categoriesImg')) {
            await fs.mkdirSync('./uploads/categoriesImg');
        }
        // save the photo
        await file.mv('./uploads/categoriesImg/' + fileName, (err) => {
            //check if was an error 
            if (err) {
                return res.status(400).json({ error: err });
            }
        });
    }

    var category;
    if (hasPhoto) {
        category = new Category({
            title: req.body.title,
            des: req.body.des,
            nestedCategories: {},
            postsCount: 0,
            imgUrl: '/uploads/categoriesImg/' + fileName,
            parentId: req.body.parentId,

        });
    } else {
        category = new Category({
            title: req.body.title,
            des: req.body.des,
            nestedCategories: {},
            postsCount: 0,
            parentId: req.body.parentId,

        });
    }

    try {
        const savedCat = await category.save();
        return res.status(201).json({ id: savedCat._id });
    } catch (error) {
        return res.status(400).json({ error: error });
    }
});


module.exports = router;
