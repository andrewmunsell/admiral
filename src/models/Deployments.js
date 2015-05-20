/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var moment = require('moment'),
Promise    = require('bluebird'),
uuid       = require('node-uuid'),
validate   = require('validate.js');

exports = module.exports = function (config) {
    var Deployments = {
        /**
         * Retrieve all deployments
         */
        all: function () {
            return Deployments.whereServiceIs(null);
        },

        /**
         * Retrieve all deployments by the specified service
         * @param {string} service
         */
        whereServiceIs: function(service) {
            if(typeof(service) == 'string') {
                service = [service];
            }

            return config.getAsync('/deployments', {recursive: true})
                .spread(function (result) {
                    return Promise.all((result.node.nodes || [] )
                            .filter(function(node) {
                                if(service) {
                                    for(var i = 0; i < service.length; i++) {
                                        if(node.key.indexOf(service[i]) > -1) {
                                            return true;
                                        }
                                    }

                                    return false;
                                } else {
                                    return true;
                                }
                            })
                            .map(function (node) {
                                return config.getAsync(node.key.replace(/^\/admiral/ig, ''), { recursive: true });
                            })
                    );
                })
                .then(function(dirs) {
                    var results = [];

                    for(var i = 0; i < dirs.length; i++) {
                        results = results.concat(dirs[i][0].node.nodes || []);
                    }

                    return results
                        .map(function(result) {
                            return JSON.parse(result.value) || null;
                        }).filter(function(result) {
                            return !!result;
                        });
                })
                .catch(function (err) {
                    if (err.errorCode == 100) {
                        return config.mkdirAsync('/deployments')
                            .then(function() {
                                return [];
                            });
                    } else {
                        return null;
                    }
                });
        },

        /**
         * Create a new deployment
         * @param params
         */
        create: function(params) {
            return Deployments.set(params, true);
        },

        /**
         * Set the specified deployment
         * @param params
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

                        service: {
                            presence: true,
                            length: {
                                is: 36
                            }
                        },

                        units: {
                            presence: true
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

                    var deployment = {
                        id: id,

                        units: params.units,

                        // Date the deployment was created
                        createdAt: params.createdAt ? params.createdAt : moment().toISOString(),

                        // Date the deployment's properties were updated
                        updatedAt: moment().toISOString()
                    };

                    return config.setAsync('/deployments/' + params.service + '/' + id, JSON.stringify(deployment));
                })
                .spread(function(result) {
                    return JSON.parse(result.node.value);
                });
        }
    };

    return Deployments;
};

exports['@singleton'] = true;
exports['@require'] = ['config'];