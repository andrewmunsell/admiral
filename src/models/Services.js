/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */


var moment = require('moment'),
    Promise = require('bluebird'),
fs = Promise.promisifyAll(require('fs')),
    uuid = require('node-uuid'),
    validate = require('validate.js');

exports = module.exports = function(config, fleetctl, ServiceGetter, Deployments) {
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
        get: function() {
            return ServiceGetter.get.apply(Services, arguments);
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
        },

        /**
         * Start the specified service by creating a new deployment, or optionally allow for the system to start a
         * partially running service.
         *
         * @param {string} id
         * @param {boolean} startPartial
         */
        start: function(id, startPartial) {
            return Promise.resolve(id)
                // Check any existing units or deployments
                .then(function (id) {
                    return Promise.all([Services.get(id), Deployments.lastDeployment(id)]);
                })
                .spread(function(service, deployment) {
                    return Promise.all([service, deployment, Deployments.state(deployment)]);
                })
                .spread(function(service, deployment, state) {
                    if(deployment == null || state == 'terminated') {
                        return Deployments
                            .create({
                                service: service.id,
                                state: 'uninitialized',

                                units: service.unitFiles.length,
                                cardinality: service.units
                            })
                            .then(function(deployment) {
                                return Deployments.submit(deployment);
                            });
                    } else if(deployment != null && state == 'running') {
                        throw new Error('A deployment for this service is already running and cannot be started again.');
                    } else if(deployment != null && state == 'partially running' && startPartial) {
                        return Promise.resolve(deployment);
                    } else if (deployment != null && state == 'initialized') {
                        return Promise.resolve(deployment);
                    } else {
                        throw new Error('This service cannot be started: currently in the ' + state + ' state.');
                    }
                })
                .then(function(deployment) {
                    return Services.get(id)
                        .then(function(service) {
                            service.state = 'starting';

                            return Services.set(service);
                        })
                        .then(function(service) {
                            return deployment;
                        });
                })
                .then(function(deployment) {
                    return Deployments.start(deployment, startPartial);
                })
                .then(function(deployment) {
                    return Services.get(id)
                        .then(function(service) {
                            service.state = 'running';

                            return Services.set(service);
                        })
                        .then(function(service) {
                            return deployment;
                        });
                })
                .then(function(deployment) {
                    return deployment;
                });
        },

        /**
         * Stop the specified service
         * @param service
         */
        stop: function(id) {
            return Promise.resolve(id)
                // Check any existing units or deployments
                .then(function (id) {
                    return Promise.all([Services.get(id), Deployments.whereServiceIs(id)]);
                })
                .spread(function(service, deployments) {
                    service.state = 'stopping';

                    deployments = deployments.filter(function(deployment) {
                        return deployment.state == 'running' || deployment.state == 'partially running';
                    });

                    return Promise.all([service, deployments]);
                })
                .spread(function(service, deployments) {
                    return Promise.all(deployments.map(function(deployment) {
                        return Deployments.stop(deployment);
                    }));
                })
                .then(function(deployments) {
                    return Services.get(id);
                })
                .then(function(service) {
                    service.state = 'stopped';

                    return Services.set(service);
                });
        },

        /**
         * Terminate the specified service
         * @param id
         */
        terminate: function(id) {
            return Promise.all([Services.get(id), Deployments.whereServiceIs(id)])
                .spread(function(service, deployments) {
                    service.state = 'terminating';

                    return Promise.all([service, deployments]);
                })
                .spread(function(service, deployments) {
                    // Terminate all of the deployments and units
                    return Promise.all(deployments.map(function(deployment) {
                        return Deployments.terminate(deployment);
                    }));
                })
                .then(function(deployments) {
                    return Services.get(id);
                })
                .then(function(service) {
                    // Now, destroy the service unit file templates from Fleet
                    return fleetctl.destroyAsync(service.unitFiles.map(function(unitFile) {
                        return unitFile.id + '@';
                    }));
                })
                .then(function() {
                    return Services.get(id);
                })
                .then(function(service) {
                    service.state = 'terminated';

                    return Services.set(service);
                });
        }
    };

    return Services;
};

exports['@singleton'] = true;
exports['@require'] = ['config', 'fleet', 'models/ServiceGetter', 'models/Deployments'];