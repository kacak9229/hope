const router = require('express').Router();
const request = require('request');

router.get('/', (req, res, next) => {
    res.render('../views/home.html', {});
});

module.exports = router;
