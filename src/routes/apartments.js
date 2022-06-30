const Apartment = require('../models/apartments');
const User = require('./users');
const auth = require('../middlewares/auth');
const checkRole = require('../middlewares/checkRole');
const { Router } = require('express');
const router = new Router();

router.post('/apartments', auth, isAdmin, async (req, res) => {
    try {
        const allowedInfo = ['name', 'images', 'description', 'price'];
        const isValid = Object.keys(req.body).every(key => allowedInfo.includes(key));
        if (!isValid) return res.status(400).send('Ivalid information detected.');

    } catch (e) {
        res.status(500).send()
    }
})
