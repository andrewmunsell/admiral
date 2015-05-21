/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var IoC = require('electrolyte'),
toCase  = require('to-case');

exports = module.exports = function (app, config, Log, Services) {
    /**
     * Get the services
     */
    app.get('/v1/services', function (req, res) {
        Services.all()
            .then(function (services) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(services);
            })
            .catch(function (err) {
                Log.error('There was a problem retrieving the services.', {
                    context: err
                });

                res
                    .status(500)
                    .json({
                        error:   500,
                        message: 'There was a problem retrieving the list of services.'
                    });
            })
            .finally(function () {
                res.end();
            });
    });

    /**
     * Get the service with the specified ID
     */
    app.get('/v1/services/:id', function(req, res) {
        Services.get(req.params.id)
            .then(function(service) {
                if(service == null) {
                    return res
                        .status(404)
                        .json({
                            error: 404,
                            message: 'The specified service does not exist.'
                        });
                }

                return service;
            })
            .then(function(service) {
                return res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(service);
            })
            .catch(function(err) {
                Log.error('There was a problem retrieving the service.', {
                    context: err
                });

                return res
                    .status(500)
                    .json({
                        error: 500,
                        message: 'There was a problem retrieving the service.'
                    })
            })
            .finally(function() {
                res.end();
            });
    });

    /**
     * Destroy the specified service
     */
    app.delete('/v1/services/:id', function(req, res) {
        Services.get(req.params.id)
            .then(function(service) {
                return Services.terminate(service.id);
            })
            .then(function(service) {
                // Delete all deployments
                return Promise.all([
                    config.rmdirAsync('/deployments/' + service.id),
                    Services.del(service.id)
                ]);
            })
            .spread(function(delResult, result) {
                if(result) {
                    res
                        .json({
                            ok: true
                        });
                } else {
                    Log.error('There was a problem deleting the service.');

                    res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem deleting the specified service.'
                        });
                }
            })
            .catch(function(err) {
                res
                    .status(404)
                    .json({
                        error: 404,
                        message: 'The specified service could not be found.'
                    });
            })
            .finally(function() {
                res.end();
            });
    });

    /**
     * Change a service's state
     */
    app.post('/v1/services/:id/state', function (req, res) {
        Services.get(req.params.id)
            .then(function (service) {
                if (service == null) {
                    return res
                        .status(404)
                        .json({
                            error:   404,
                            message: 'The specified service does not exist.'
                        });
                }

                return service;
            })
            .then(function (service) {
                var ServiceTemplate = IoC.create('service-templates/' + toCase.pascal(service.template));

                Log.info('Changing the state of a service.', {
                    service: service.id,
                    state: req.body.state
                });

                switch (req.body.state) {
                    case 'starting':
                        return ServiceTemplate.start(service);
                        break;
                    case 'stopping':
                        return ServiceTemplate.stop(service);
                        break;
                    case 'terminating':
                        return ServiceTemplate.terminate(service);
                        break;
                    default:
                        return res
                            .status(400)
                            .json({
                                error:   400,
                                message: 'An invalid state was specified.'
                            });
                        break;
                }
            })
            .then(function (deployment) {
                return res
                    .header('Cache-Control', 'no-cache')
                    .json(deployment);
            })
            .catch(function (err) {
                Log.error('There was a problem changing the service\'s state.', {
                    message: err.message,
                    stack:   err.stack,
                    context: err
                });

                res
                    .status(500)
                    .json({
                        error:   500,
                        message: 'There was a problem changing the service\'s state.'
                    });
            })
            .finally(function () {
                res.end();
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config', 'logger', 'models/Services'];