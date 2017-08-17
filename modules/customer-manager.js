const Q = require('q');
const User = require('../models/user');

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
    findByFacebookId: findByFacebookId
};
