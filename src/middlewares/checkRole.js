function checkRole(target) {
    return (req, res, next) => {
        if (req.user.role !== target) return res.status(401).send({ message: 'Unauthorized.' });
        next();
    }
}
module.exports = checkRole;
