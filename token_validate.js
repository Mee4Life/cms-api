const jwt = require('jsonwebtoken');

// verify a token
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({error:'Access Denied'});
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verify;
        next();
    } catch (err) {
        res.status(403).json({error: 'invalid token'});
    }
}

module.exports = verifyToken;
