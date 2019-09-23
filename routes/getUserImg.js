const router = require('express').Router();
const path = require('path');
const fs = require('fs');

router.get('/user/profilePhoto', (req, res)=>{
    //check if the img id is inserted with the request as query param
    if(!req.query.id){res.status(400).json({error: 'insert the img id in the request'}); return;}

    const imgPath = './uploads/userImg/'+req.query.id;
    fs.access(imgPath, fs.F_OK, (err)=>{
        if(err){
            res.status(400).json({error: 'image can not be founded'});
            return;
        }
        res.sendFile(path.join(__dirname, '../uploads/userImg', req.query.id));
    });
});

module.exports = router;
