const logger = require('./../modules/logger');
const driverManager = require('./../modules/driver-manager');
const router = require('express').Router();
const checkJWT = require('../middlewares/checking-jwt');

/**
 * Stores driver's location
 */
router.post('/trace', checkJWT, (req, res, next) => {
    let driverId = req.body.driver_id;
    let lat = req.body.lat;
    let lon = req.body.lon;

    //TODO: Check if post values are in acceptable format and are valid
    //TODO: Check if lat/lon values are correct

    driverManager.trace(driverId, lat, lon)
        .then(reply => {
            res.json({
                status: 'OK',
                reply: reply
            });
        })
        .catch(err => {
            res.json({
                status: 'Failed',
                err: err
            });
        });
});


/**
 * Returns driver's location
 */
router.get('/get-location', checkJWT, function(req, res) {
    let driverId = req.query.driverid;
    driverManager.getLocation(driverId)
        .then(location => {
            res.json(location);
        })
        .catch(err => {
            res.json({
                status: 'Failed',
                err: err
            });
        })
});

/**
 * Returns driver's location
 */
router.get('/get-location', function(req, res) {
    let driverId = req.query.driverid;
    driverManager.getLocation(driverId)
        .then(location => {
            res.json(location);
        })
        .catch(err => {
            res.json({
                status: 'Failed',
                err: err
            });
        })
});

/**
 * Find nearby drivers
 */
router.get('/find', checkJWT, function(req, res) {
    const lat = req.query.lat;
    const lon = req.query.lon;
    const radius = +req.query.radius;

    //console.log(`Customer's lat and lon: `, req.query);

    driverManager.find(lat, lon, radius)
        .then(drivers => {
            //console.log('Found the following drivers: ', drivers)
            res.json(drivers);
        })
        .catch(err => {
            res.json({
                status: 'Failed',
                err: err
            });
        })
});

module.exports = router;
