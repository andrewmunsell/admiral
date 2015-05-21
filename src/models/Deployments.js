/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var moment = require('moment'),
Promise    = require('bluebird'),
fs         = Promise.promisifyAll(require('fs')),
uuid       = require('node-uuid'),
validate   = require('validate.js');

exports = module.exports = function (config, fleetctl, ServiceGetter) {
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
        whereServiceIs: function (service) {
            if (typeof(service) == 'string') {
                service = [service];
            }

            return config.getAsync('/deployments', {recursive: true})
                .spread(function (result) {
                    return Promise.all((result.node.nodes || [] )
                            .filter(function (node) {
                                if (service) {
                                    for (var i = 0; i < service.length; i++) {
                                        if (node.key.indexOf(service[i]) > -1) {
                                            return true;
                                        }
                                    }

                                    return false;
                                } else {
                                    return true;
                                }
                            })
                            .map(function (node) {
                                return config.getAsync(node.key.replace(/^\/admiral/ig, ''), {recursive: true});
                            })
                    );
                })
                .then(function (dirs) {
                    var results = [];

                    for (var i = 0; i < dirs.length; i++) {
                        results = results.concat(dirs[i][0].node.nodes || []);
                    }

                    return results
                        .map(function (result) {
                            return JSON.parse(result.value) || null;
                        }).filter(function (result) {
                            return !!result;
                        });
                })
                .catch(function (err) {
                    if (err.errorCode == 100) {
                        return config.mkdirAsync('/deployments')
                            .then(function () {
                                return [];
                            });
                    } else {
                        return null;
                    }
                });
        },

        /**
         * Get the deployment with the specified ID
         * @param id
         */
        get: function (id) {
            return Deployments.all()
                .then(function (deployments) {
                    return deployments.filter(function (deployment) {
                        return deployment.id == id;
                    });
                })
                .then(function (deployments) {
                    if (deployments.length != 1) {
                        throw new Error('The specified deployment could not be found.');
                    } else {
                        return deployments[0];
                    }
                });
        },

        /**
         * Get the last deployment for the specified service, or null if there haven't been any deployments yet.
         * @param service
         */
        lastDeployment: function (service) {
            return Deployments.whereServiceIs(service)
                .then(function (deployments) {
                    var maxDate = moment(0);
                    var maxDeployment = null;

                    for (var i = 0; i < deployments.length; i++) {
                        if (!deployments[i].hasOwnProperty('date')) {
                            continue;
                        }

                        var date = moment(deployments[i].date);

                        if (date.isAfter(maxDate)) {
                            maxDate = date;
                            maxDeployment = deployments[i];
                        }
                    }

                    return maxDeployment;
                });
        },

        /**
         * Create a new deployment
         * @param params
         */
        create: function (params) {
            return Deployments.set(params, true);
        },

        /**
         * Get the number of running units for the specified deployment
         * @param deployment
         * @returns {*}
         */
        runningUnits: function (deployment) {
            return Promise.resolve(deployment)
                .then(function (deployment) {
                    if (typeof(deployment) == 'object') {
                        return deployment;
                    } else {
                        return Deployments.get(deployment);
                    }
                })
                .then(function (deployment) {
                    return Promise.all([deployment, fleetctl.list_unitsAsync()]);
                })
                .spread(function (deployment, units) {
                    var unitMatch = new RegExp("\\@" + deployment.id + "\\-[\\d]+$");

                    return units.filter(function (unit) {
                        return unit.unit.match(unitMatch) != null;
                    }).length;
                });
        },

        /**
         * Get the current state of the deployment
         * @param deployment
         */
        state: function (deployment) {
            return Promise.resolve(deployment)
                .then(function (deployment) {
                    if (typeof(deployment) == 'object') {
                        return deployment;
                    } else if (deployment == null) {
                        return null;
                    } else {
                        return Deployments.get(deployment);
                    }
                })
                .then(function (deployment) {
                    if (deployment == null) {
                        return null;
                    }

                    switch (deployment.state) {
                        case 'running':
                            // Check the number of running units
                            return Deployments.runningUnits(deployment)
                                .then(function (runningUnits) {
                                    if (runningUnits == deployment.units * deployment.cardinality) {
                                        return 'running';
                                    } else {
                                        return 'partially running';
                                    }
                                });
                        default:
                            return deployment.state;
                    }
                });
        },

        /**
         * Get all of the submitted units for the specified
         * @param id
         */
        submittedUnits: function (deployment) {
            return Promise.resolve(deployment)
                .then(function (deployment) {
                    if (typeof(deployment) == 'object') {
                        return deployment;
                    } else if (deployment == null) {
                        return null;
                    } else {
                        return Deployments.get(deployment);
                    }
                })
                .then(function (deployment) {
                    return Promise.all([
                        deployment,
                        ServiceGetter.get(deployment.service),

                        fleetctl.list_unitsAsync()
                    ]);
                })
                .spread(function (deployment, service, units) {
                    var unitFileIds = service.unitFiles.map(function (unitFile) {
                        return unitFile.id;
                    });

                    return units.filter(function (unit) {
                        var unitTemplate = unit.unit.split('@')[0];

                        return unitFileIds.indexOf(unitTemplate) > -1 && unit.unit.indexOf(deployment.id) > -1;
                    });
                });
        },

        /**
         * Set the specified deployment
         * @param params
         */
        set: function (params, create) {
            return Promise.resolve()
                .then(function () {
                    var constraints = {
                        id: {
                            length: {
                                is: 36
                            }
                        },

                        service: {
                            presence: true,
                            length:   {
                                is: 36
                            }
                        },

                        units: {
                            presence:     true,
                            numericality: {
                                onlyInteger:          true,
                                greaterThanOrEqualTo: 0
                            }
                        },

                        cardinality: {
                            presence:     true,
                            numericality: {
                                onlyInteger:          true,
                                greaterThanOrEqualTo: 0
                            }
                        }
                    };

                    var errors = validate(params, constraints);
                    if (errors) {
                        throw errors;
                    }

                    var id;

                    if (create === true && !params.id) {
                        id = uuid.v4();
                    } else {
                        id = params.id;
                    }

                    var deployment = {
                        id: id,

                        units:       params.units,
                        cardinality: params.cardinality,

                        service: params.service,
                        state:   params.state ? params.state : 'uninitialized',

                        date:      params.date ? params.date : moment().toISOString(),
                        // Date the deployment was created
                        createdAt: params.createdAt ? params.createdAt : moment().toISOString(),
                        // Date the deployment's properties were updated
                        updatedAt: moment().toISOString()
                    };

                    return config.setAsync('/deployments/' + params.service + '/' + id, JSON.stringify(deployment));
                })
                .spread(function (result) {
                    return JSON.parse(result.node.value);
                });
        },

        /**
         * Submit the specified deployment to Fleet
         * @param id
         */
        submit: function (id) {
            return Promise.resolve(id)
                .then(function (deployment) {
                    if (typeof(deployment) == 'object') {
                        return deployment;
                    } else {
                        return Deployments.get(deployment);
                    }
                })
                .then(function (deployment) {
                    return Promise.all([
                        deployment,

                        ServiceGetter.get(deployment.service)
                    ]);
                })
                .spread(function (deployment, service) {
                    // Get the unit files and write them to temporary files
                    // Store the unit files into a temporary directory so that they can
                    // be submitted to Fleet.
                    var unitFiles = service.unitFiles;

                    return Promise.all(unitFiles.map(function (unitFile) {
                        var file = '/tmp/' + unitFile.id + '@.service';

                        return fs.writeFileAsync(file, unitFile.value);
                    }))
                        .then(function () {
                            return [deployment, service];
                        });
                })
                .spread(function (deployment, service) {
                    // Submit the new units
                    return fleetctl
                        .submitAsync(service.unitFiles.map(function (unitFile) {
                            return '/tmp/' + unitFile.id + '@.service';
                        }))
                        .then(function () {
                            return deployment;
                        });
                })
                .then(function (deployment) {
                    deployment.state = 'initialized';

                    return Deployments.set(deployment);
                });
        },

        /**
         * Start a deployment with the specified ID, optionally starting any partially running services
         * @param id
         */
        start: function (id, startPartial) {
            return Promise.resolve(id)
                .then(function (deployment) {
                    if (typeof(deployment) == 'object') {
                        return deployment;
                    } else {
                        return Deployments.get(deployment);
                    }
                })
                .then(function (deployment) {
                    deployment.state = 'starting';

                    return Promise.all([
                        Deployments.set(deployment),
                        ServiceGetter.get(deployment.service),
                        Deployments.submittedUnits(deployment)
                    ]);
                })
                .spread(function (deployment, service, units) {
                    units = units.filter(function(unit) {
                        return unit.sub == 'running' && unit.state == 'active';
                    });

                    var unitsToLaunch = [];

                    for(var i = 0; i < service.unitFiles.length; i++) {
                        for(var n = 0; n < deployment.cardinality; n++) {
                            unitsToLaunch.push(service.unitFiles[i].id + '@' + deployment.id + '-' + n);
                        }
                    }

                    if(units.length > 0 && units.length < deployment.cardinality * deployment.units) {
                        if(startPartial) {
                            // Find the units that need to be started
                            for(var i = 0; i < units.length; i++) {
                                var ind = unitsToLaunch.indexOf(units[i].unit);

                                if(ind > -1) {
                                    unitsToLaunch.splice(ind, 1);
                                }
                            }
                        } else {
                            throw new Error('The service is only partially running and cannot be started directly.');
                        }
                    }

                    return fleetctl.startAsync(unitsToLaunch, {})
                        .then(function() {
                            deployment.state = 'running';

                            return Deployments.set(deployment);
                        });
                });
        },

        /**
         * Stop the units in the specified deployment
         * @param deployment
         * @returns {*}
         */
        stop: function(deployment) {
            return Promise.resolve(deployment)
                .then(function (deployment) {
                    if (typeof(deployment) == 'object') {
                        return deployment;
                    } else {
                        return Deployments.get(deployment);
                    }
                })
                .then(function (deployment) {
                    deployment.state = 'stopping';

                    return Promise.all([
                        Deployments.set(deployment),
                        ServiceGetter.get(deployment.service),
                        Deployments.submittedUnits(deployment)
                    ]);
                })
                .spread(function (deployment, service, units) {
                    units = units.filter(function(unit) {
                        var unitFile = unit.unit.split('@')[0];

                        return service.unitFiles.map(
                                function(unitFile) {
                                    return unitFile.id;
                                }
                            ).indexOf(unitFile) > -1 && unit.unit.indexOf(deployment.id) > -1
                    });

                    runningUnits = units.filter(function(unit) {
                        return (unit.sub == 'running' && unit.active == 'active') ||
                            (unit.sub == 'start-pre' && unit.active == 'activating');
                    });

                    runningUnits = runningUnits
                        .map(function(unit) {
                            return unit.unit;
                        });

                    return fleetctl.stopAsync(runningUnits, {})
                        .then(function() {
                            if(runningUnits.length == units.length) {
                                deployment.state = 'initialized';
                            } else {
                                deployment.state = 'partially running';
                            }

                            return Deployments.set(deployment);
                        });
                });
        },

        /**
         * Terminate all units of the specified deployment and destroy their unit files.
         * @param deployment
         */
        terminate: function(deployment) {
            return Promise.resolve(deployment)
                .then(function (deployment) {
                    if (typeof(deployment) == 'object') {
                        return deployment;
                    } else {
                        return Deployments.get(deployment);
                    }
                })
                .then(function (deployment) {
                    deployment.state = 'terminating';

                    return Promise.all([
                        Deployments.set(deployment),
                        ServiceGetter.get(deployment.service),
                        Deployments.submittedUnits(deployment)
                    ]);
                })
                .spread(function (deployment, service, units) {
                    units = units
                        .filter(function(unit) {
                            var unitFile = unit.unit.split('@')[0];

                            return service.unitFiles.map(
                                    function(unitFile) {
                                        return unitFile.id;
                                    }
                                ).indexOf(unitFile) > -1 && unit.unit.indexOf(deployment.id) > -1
                        })
                        .map(function(unit) {
                            return unit.unit;
                        });

                    return fleetctl.destroyAsync(units);
                })
                .then(function() {
                    deployment.state = 'terminated';

                    return Deployments.set(deployment);
                });
        }
    };

    return Deployments;
};

exports['@singleton'] = true;
exports['@require'] = ['config', 'fleet', 'models/ServiceGetter'];