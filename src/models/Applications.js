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
    var Applications = {
        /**
         * Retrieve all applications
         */
        all: function() {
            return config.getAsync('/applications', { recursive: true })
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
         * Create a new application with the specified parameters
         * @param params
         */
        create: function(params) {
            return Promise.resolve()
                .then(function() {
                    var constraints = {
                        name: {
                            presence: true,
                            length: {
                                maximum: 36
                            }
                        }
                    };

                    var errors = validate(params, constraints);
                    if(errors) {
                        throw errors;
                    }

                    var id = uuid.v4();

                    var app = {
                        id: id,
                        name: params.name,

                        createdAt: moment().toISOString()
                    };

                    return config.setAsync('/applications/' + id, JSON.stringify(app));
                })
                .spread(function(result) {
                    return JSON.parse(result.node.value);
                });
        },

        /**
         * Get a single application, or null if the application does not exist.
         * @param id
         */
        get: function(id) {
            return config.getAsync('/applications/' + id)
                .spread(function(result) {
                    return JSON.parse(result.node.value);
                })
                .catch(function(err) {
                    if(err.errorCode == 100) {
                        return null;
                    } else {
                        throw new Error('There was a problem fetching the application.');
                    }
                });
        },

        /**
         * Delete the specified application
         * @param id
         */
        del: function(id) {
            return config.delAsync('/applications/' + id)
                .spread(function(result) {
                    return true;
                })
                .catch(function(err) {
                    if(err.errorCode == 100) {
                        throw new Error('The specified application does not exist.');
                    } else {
                        return false;
                    }
                });
        }
    };

    return Applications;
};

exports['@singleton'] = true;
exports['@require'] = ['config'];