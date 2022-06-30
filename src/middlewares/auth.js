const jwt = require('jsonwebtoken');
const User = require('../models/users');

async function auth(req, res, next) {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decode._id, 'tokens.token': token, active: true })
        if (!user) throw new Error();
        req.token = token;
        req.user = user;
        next()
    }
    catch (e) {
        res.status(401).send({ message: 'Please authenticate.' })
    }
}
module.exports = auth;