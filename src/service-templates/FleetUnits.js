/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var Promise    = require('bluebird');

var fs     = Promise.promisifyAll(require('fs')),
Handlebars = require('handlebars'),
moment     = require('moment'),
validate   = require('validate.js'),
uuid       = require('node-uuid');

/**
 * Initialize the specified service
 * @param service
 */
module.exports = exports = function (fleetctl, Services, Deployments) {
    return {
        /**
         * Create the specified service
         * @param service
         */
        create: function (service, parameters) {
            var constraints = {
                unitFiles: {
                    length: {
                        minimum: 1,
                        maximum: 10
                    }
                }
            };

            var errors = validate(parameters, constraints);
            if (errors) {
                throw errors;
            }

            // Get the most recent service
            return Services.get(service.id)
                // Save the unit files
                .then(function (service) {
                    service.unitFiles = [];

                    for (var i = 0; i < parameters.unitFiles.length; i++) {
                        var id = uuid.v4();

                        service.unitFiles.push({
                            id:    id,
                            value: parameters.unitFiles[i]
                        });
                    }

                    return Services.set(service);
                })
                // Register the application with the router, if requested
                .then(function (service) {
                    if (parameters.router && parameters.router.ports) {
                        var template = Handlebars.compile(
                            fs.readFileSync(__dirname + '/../../resources/unit-files/router-register@.service.template',
                                {
                                    encoding: 'utf8'
                                }
                            )
                        );

                        for (var i = 0; i < parameters.router.ports.length; i++) {
                            var id = uuid.v4();

                            service.unitFiles.push({
                                id:    id,
                                value: template({
                                    service: service,

                                    unitFile: {
                                        parent: service.unitFiles[0]
                                    },

                                    port: parameters.router.ports[i]
                                })
                            });
                        }

                        return Services.set(service);
                    } else {
                        return service;
                    }
                });
        },

        /**
         * Start the specified service
         * @param service
         */
        start: function (service) {
            return Promise.resolve(service)
                // Check any existing units or deployments
                .then(function (service) {
                    return Promise.all([service, Deployments.whereServiceIs(service.id)]);
                })
                .spread(function (service, deployments) {
                    var maxDate = moment(0);
                    var maxDeployment = null;

                    for (var i = 0; i < deployments.length; i++) {
                        var date = moment(deployments[i].date);

                        if (date.isBefore(maxDate)) {
                            maxDate = date;
                            maxDeployment = deployments[i];
                        }
                    }

                    // Check the latest deployment to see whether the units are still running. If not,
                    // then we can continue. If they're running, we throw an error because we can't
                    // start a running service.
                    if(maxDeployment != null) {
                        var id = maxDeployment.id;

                        return fleetctl.list_unitsAsync()
                            .then(function(units) {
                                console.log(units);
                            });
                    } else {
                        return service;
                    }
                })
                .then(function(service) {
                    // Set the state to starting
                    service.state = 'starting';

                    return Services.set(service);
                })
                .then(function(service) {
                    // Store the unit files into a temporary directory so that they can
                    // be submitted to Fleet.
                    var unitFiles = service.unitFiles;

                    return Promise.all(unitFiles.map(function(unitFile) {
                        var file = '/tmp/' + unitFile.id + '@.service';

                        return fs.writeFileAsync(file, unitFile.value);
                    }))
                        .then(function() {
                            return [service].concat(unitFiles.map(function(unitFile) {
                                return unitFile.id;
                            }));
                        });
                })
                .then(function(unitFiles) {
                    // Submit the new units
                    return fleetctl.submitAsync(unitFiles.slice(1).map(function(unitFile) {
                        return '/tmp/' + unitFile + '@.service';
                    }))
                        .then(function() {
                            return unitFiles;
                        })
                })
                .then(function(unitFiles) {
                    // Schedule the units
                    var service = unitFiles.splice(0, 1)[0];
                    var deployment = uuid.v4();

                    var units = [];

                    for(var n = 0; n < service.units; n++) {
                        for(var i = 0; i < unitFiles.length; i++) {
                            var unitName = unitFiles[i] + '@' + deployment + '-' + n;

                            units.push(unitName);
                        }
                    }

                    return fleetctl.loadAsync(units, {})
                        .then(function() {
                            return [service, deployment].concat(units);
                        });
                })
                .then(function(units) {
                    return fleetctl.startAsync(units.slice(2), {})
                        .then(function() {
                            return units;
                        });
                })
                .then(function(units) {
                    // Save the deployment to etcd
                    var service = units.splice(0, 1)[0];
                    var deployment = units.splice(0, 1)[0];

                    return Deployments.create({
                        id: deployment,
                        service: service.id,

                        units: units.map(function(unit) {
                            return unit.split('@')[1];
                        })
                    });
                });
        }
    };
};

exports['@singleton'] = true;
exports['@require'] = ['fleet', 'models/Services', 'models/Deployments'];