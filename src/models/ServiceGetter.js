/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var Promise = require('bluebird');

exports = module.exports = function(config) {
    var ServiceGetter = {
        /**
         * Get a single service, or null if the service does not exist.
         * @param id
         */
        get: function(id) {
            return config.getAsync('/services/' + id)
                .spread(function(result) {
                    return JSON.parse(result.node.value);
                })
                .catch(function(err) {
                    if(err.errorCode == 100) {
                        return null;
                    } else {
                        throw new Error('There was a problem fetching the service.');
                    }
                });
        }
    };

    return ServiceGetter;
};

exports['@singleton'] = true;
exports['@require'] = ['config'];