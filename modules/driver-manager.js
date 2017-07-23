const logger = require('./logger');
const geo = require('./redis').geo;
const Q = require('q');

function trace(driverId, lat, lon) {
    let deferred = Q.defer();

    geo.addLocation(driverId, {latitude: lat, longitude: lon}, function(err, reply) {
        if(err) {
            logger.error('Geo add location error!', err);
            deferred.reject(new Error(err));
        }
        else {
            logger.log('added location:', reply);
            deferred.resolve(reply);
        }
    });

    return deferred.promise;
}

function getLocation(driverId) {
    let deferred = Q.defer();

    geo.location(driverId, (err, location) => {
        if(err) {
            logger.error('Could not driver\'s location!', err);
            deferred.reject(new Error(err));
        }
        else {
            deferred.resolve(location);
        }
    });

    return deferred.promise;
}

/**
 * Finds nearby drivers to the lat, lon
 * @param lat
 * @param lon
 * @param radius in meter
 * @returns {*|promise}
 */
function find(lat, lon, radius) {
    let deferred = Q.defer();

    geo.nearby({latitude: lat, longitude: lon}, radius, (err, locations) => {
        if(err) {
            logger.error('Could not driver\'s!', err);
            deferred.reject(new Error(err));
        }
        else {
            deferred.resolve(locations);
        }
    });

    return deferred.promise;
}

module.exports = {
    trace: trace,
    getLocation: getLocation,
    find: find
};