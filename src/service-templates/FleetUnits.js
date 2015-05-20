/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var fs = require('fs'),
    Handlebars = require('handlebars'),
    validate = require('validate.js'),
    uuid = require('node-uuid');

/**
 * Initialize the specified service
 * @param service
 */
module.exports = exports = function(Services) {
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
        }
    };
};

exports['@singleton'] = true;
exports['@require'] = ['models/Services'];