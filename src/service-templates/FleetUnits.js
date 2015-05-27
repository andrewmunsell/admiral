/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var Promise    = require('bluebird');

var fs     = Promise.promisifyAll(require('fs')),
mustache = require('mustache'),
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
                            value: mustache.render("{{=<% %>=}}\n" + parameters.unitFiles[i], {
                                unitFile: {
                                    id: id
                                },

                                service: service
                            })
                        });
                    }

                    return Services.set(service);
                })
                // Register the application with the router, if requested
                .then(function (service) {
                    if (parameters.router && parameters.router.ports) {
                        var template = fs.readFileSync(__dirname + '/../../resources/unit-files/router-register@.service.template',
                            {
                                encoding: 'utf8'
                            }
                        );

                        for (var i = 0; i < parameters.router.ports.length; i++) {
                            var id = uuid.v4();

                            service.unitFiles.push({
                                id:    id,
                                port: parameters.router.ports[i],
                                value: mustache.render(template, {
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
            return Services.start(service.id, true);
        },

        /**
         * Stop the specified service
         * @param service
         */
        stop: function (service) {
            return Services.stop(service.id);
        },

        /**
         * Unload the specified service and unschedule all of its units
         * @param service
         */
        unload: function(service) {
            return Services.unload(service.id);
        },

        /**
         * Terminate the specified service
         * @param service
         */
        terminate: function (service) {
            return Services.terminate(service.id);
        }
    };
};

exports['@singleton'] = true;
exports['@require'] = ['fleet', 'models/Services', 'models/Deployments'];