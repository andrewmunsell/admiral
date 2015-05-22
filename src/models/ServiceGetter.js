/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var Promise = require('bluebird');

exports = module.exports = function(config, fleetctl) {
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
                .then(function(service) {
                    return Promise.all([service, fleetctl.list_unitsAsync()]);
                })
                .spread(function(service, unitFiles) {
                    var unitFileIds = service.unitFiles.map(function(unitFile) {
                        return unitFile.id;
                    });

                    unitFiles.forEach(function(unitFile) {
                        var id = unitFile.unit.split('@')[0];
                        var i = unitFileIds.indexOf(id);

                        if(i > -1) {
                            if(typeof(service.unitFiles[i].units) == 'undefined') {
                                service.unitFiles[i].units = [];
                            }

                            service.unitFiles[i].units.push(unitFile);
                        }
                    });

                    return service;
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
exports['@require'] = ['config', 'fleet'];