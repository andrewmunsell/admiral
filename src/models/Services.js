/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var moment = require('moment'),
    Promise = require('bluebird'),
    uuid = require('node-uuid'),
    validate = require('validate.js');

exports = module.exports = function(config) {
    var Services = {
        /**
         * Retrieve all services
         */
        all: function() {
            return config.getAsync('/services', { recursive: true })
                .spread(function(result) {
                    return (result.node.nodes || [] ).map(function(node) {
                        return JSON.parse(node.value);
                    });
                })
                .catch(function(err) {
                    if(err.errorCode == 100) {
                        return [];
                    } else {
                        return null;
                    }
                });
        },

        /**
         * Create a new service with the specified parameters
         * @param params
         */
        create: function(params) {
            return Services.set(params, true);
        },

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
        },

        /**
         * Set the specified service
         * @param service
         */
        set: function(params, create) {
            return Promise.resolve()
                .then(function() {
                    var constraints = {
                        id: {
                            length: {
                                is: 36
                            }
                        },

                        name: {
                            presence: true,
                            length: {
                                maximum: 36
                            }
                        },

                        application: {
                            presence: true,
                            length: {
                                is: 36
                            }
                        },

                        template: {
                            presence: true,
                            length: {
                                maximum: 36
                            }
                        },

                        state: {
                            length: {
                                maximum: 36
                            }
                        },

                        units: {
                            numericality: {
                                onlyInteger: true,
                                greaterThanOrEqualTo: 0
                            }
                        }
                    };

                    var errors = validate(params, constraints);
                    if(errors) {
                        throw errors;
                    }

                    var id;

                    if(create === true) {
                        id = uuid.v4();
                    } else {
                        id = params.id;
                    }

                    var service = {
                        id: id,
                        application: params.application,

                        name: params.name,

                        template: params.template,

                        state: params.state ? params.state : 'idle',
                        units: params.units,

                        unitFiles: params.unitFiles ? params.unitFiles : [],

                        // Date the service was created
                        createdAt: params.createdAt ? params.createdAt : moment().toISOString(),

                        // Date the service's properties were updated
                        updatedAt: moment().toISOString(),

                        // Date the service state changed last
                        changedAt: null
                    };

                    return config.setAsync('/services/' + id, JSON.stringify(service));
                })
                .spread(function(result) {
                    return JSON.parse(result.node.value);
                });
        },

        /**
         * Delete the specified service
         * @param id
         */
        del: function(id) {
            return config.delAsync('/services/' + id)
                .spread(function(result) {
                    return true;
                })
                .catch(function(err) {
                    if(err.errorCode == 100) {
                        throw new Error('The specified service does not exist.');
                    } else {
                        return false;
                    }
                });
        }
    };

    return Services;
};

exports['@singleton'] = true;
exports['@require'] = ['config'];