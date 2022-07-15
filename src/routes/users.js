const { Router } = require('express');
const router = new Router();
const User = require('../models/users');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');

//user sign up
router.post('/users', async (req, res) => {
    try {
        const allowedInfo = ['name', 'email', 'password'];
        const isValid = Object.keys(req.body).every(key => allowedInfo.includes(key) && req.body[key].length > 0);
        if (!isValid) return res.status(400).send('Bad request');
        req.body.role = 'buyer';
        req.body.active = true;
        const user = new User(req.body);
        await user.save();
        res.status(200).send('Sign up successfull.')
    }
    catch (e) {
        res.status(500).send();
    }
});

//user sign in
router.post('/users/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).send('Bad request.')
        const user = await User.findByCredentials(email, password);
        const token = await user.generateAuthToken();
        res.status(200).send({ user, token });
    }
    catch (e) {
        res.status(500).send(e.message);
    }
});

//user sign out
router.post('/users/signout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token && token);
        await req.user.save();
        res.status(200).send('success');
    }
    catch (e) {
        res.status(500).send()
    }
});

//user sign out from all device
router.post('/users/signout/all', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.status(200).send('Success');
    }
    catch (e) {
        res.status(500).send();
    }
});

//user update
router.patch('/users/me', auth, async (req, res) => {
    try {
        const updates = Object.keys(req.body)
        const allowedUpdates = ['name', 'password', 'email', 'phone', 'address', 'familyMember']
        const isValidOperation = updates.every((update) => allowedUpdates.includes(update))
        if (!isValidOperation) return res.status(400).send({ error: 'Invalid updates!' })
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send(req.user)
    } catch (e) {
        res.status(400).send(e.message)
    }
});

//get own profile
router.get('/users/me', auth, async (req, res) => res.status(200).send(req.user));

//make admin
router.patch('/users/role/:id', auth, checkRole('owner'), async (req, res) => {
    const user = await User.findOne({ _id: req.params.id })
    user.role = 'admin';
    await user.save();
    if (!user) return res.status(404).send('User not found.');
    res.status(200).send(user);
});

module.exports = router;