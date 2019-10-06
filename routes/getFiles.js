const router = require('express').Router();
const path = require('path');
const fs = require('fs');

router.get('/uri', (req, res) => {
    //check if the img uri is inserted with the request as query param
    if (!req.query.uri) { res.status(400).json({ error: 'insert the img uri in the request' }); return; }

    const imgPath = '.' + req.query.uri;
    fs.access(imgPath, fs.F_OK, (err) => {
        if (err) {
            res.status(400).json({ error: 'image can not be founded'});
            return;
        }
        res.sendFile(path.join(__dirname, '..' + req.query.uri ));
    });
});

module.exports = router;
