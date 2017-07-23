const router = require('express').Router();

router.post('/trace', (req, res, next) => {
    let driverId = req.body.driver_id;
    let lat = req.body.lat;
    let lon = req.body.lon;

    //TODO: Check if post values are in acceptable format and are valid
    //TODO: Check if lat/lon values are correct

    res.json([
        lat,
        lon,
        driverId
    ]);
});

module.exports = router;
