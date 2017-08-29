const logger = require('./logger');
const geo = require('./redis').geo;
const Q = require('q');
const User = require('../models/user');
const redisClient = require('./redis').client;

const TRACE_EXPIRE_PREFIX = 'TTP_';
//After how long should the system check if the trace expired
const TRACE_EXPIRE = 10000;
const TRACE_EXPIRE_VERIFY = 20000;

function removeDriverTrace(driverId) {
    geo.removeLocation(driverId, function(err, reply){
        if(err) console.error(err);
        else console.log('removed location:', reply);
    })
}

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

            //Handle expiry
            //TODO: in case of lag and the last timeout did not expire, implement clearTimeout
            const TRACE_TIMEOUT_KEY = `${TRACE_EXPIRE_PREFIX}${driverId}`;
            redisClient.set(TRACE_TIMEOUT_KEY, driverId);
            redisClient.expire(TRACE_TIMEOUT_KEY, TRACE_EXPIRE/1000);

            setTimeout(() => {
                console.info(`Driver trace expiry triggered for driver: ${driverId}`);

                redisClient.get(TRACE_TIMEOUT_KEY, (err, reply) => {
                    if(err) {
                        console.info(`Driver trace expired: ${TRACE_TIMEOUT_KEY}! Removing Location!`);
                        removeDriverTrace(driverId);
                    }
                    else {
                        console.log(`Driver info in timeout =====>`, reply);
                        if(!reply) {
                            removeDriverTrace(driverId);
                        }
                    }
                });
            }, TRACE_EXPIRE_VERIFY)
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
    const findOptions = {
        withCoordinates: true,
        withHashes: true,
        withDistances: true,
        order: 'ASC',
        units: 'm',
        count: 50,
        accurate: false // Useful if in emulated mode and accuracy is important, default false
    };

    geo.nearby({latitude: lat, longitude: lon}, radius, findOptions, (err, locations) => {
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

//Refactor me: put me in a common function
function findByFacebookId(facebookId) {
    const deferred = Q.defer();

    User.findOne({facebookId: facebookId}, function(err, user) {
        if(user) deferred.resolve(user);
        else deferred.reject(new Error(err));
    });

    return deferred.promise;
}

module.exports = {
    trace: trace,
    getLocation: getLocation,
    find: find,
    findByFacebookId: findByFacebookId
};
