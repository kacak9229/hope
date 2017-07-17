const router = require('express').Router();
const request = require('request');

/* LANDING PAGE  -- SOON ONCE APIS HAVE BEEN CREATED */
router.get('/', (req, res, next) => {
    res.render('main/home');
});

/* DRIVER SIGNUP */
module.exports = router;
