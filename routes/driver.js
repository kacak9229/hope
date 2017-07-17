const router = require('express').Router();

/* GET LAT AND LONG FROM THE DRIVER */
router.get('/trace', (req, res, next) => {
    let lat = req.body.driver_lat;
    let long = req.body.driver_lat;
    res.json(`${lat} ${long}`);
});

module.exports = router;
