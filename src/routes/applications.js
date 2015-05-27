/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var IoC = require('electrolyte'),
Promise = require('bluebird'),
toCase  = require('to-case');

exports = module.exports = function (app, config, Log, Applications, Services) {
    /**
     * Get the applications
     */
    app.get('/v1/applications', function (req, res) {
        Promise.all([Applications.all(), Services.all()])
            .spread(function (applications, services) {
                for (var i = 0; i < applications.length; i++) {
                    applications[i].services = services.filter(function (service) {
                        // Only get services for the requested application, and only get
                        // terminated services if they were terminated in the last 5 minutes
                        return service.application == applications[i].id && !(service.state == 'terminated' && service.changedAt &&
                            moment(service.changedAt).isBefore(moment().subtract(5, 'minutes'))
                            );
                    });
                }

                return applications;
            })
            .then(function (applications) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(applications);
            })
            .catch(function (err) {
                Log.error('There was a problem retrieving the applications.', {
                    context: err
                });

                res
                    .status(500)
                    .json({
                        error:   500,
                        message: 'There was a problem retrieving the list of applications.'
                    });
            })
            .finally(function () {
                res.end();
            });
    });

    /**
     * Create a new application
     */
    app.post('/v1/applications', function (req, res) {
        Applications.create(req.body)
            .then(function (application) {
                res
                    .json(application);
            })
            .catch(function (errors) {
                return res
                    .status(400)
                    .json(errors)
                    .end();
            });
    });

    /**
     * Get information for the specified application
     */
    app.get('/v1/applications/:id', function (req, res) {
        Applications.get(req.params.id)
            .then(function (application) {
                return Promise.all([application, Services.all()]);
            })
            .spread(function (application, services) {
                if (application == null) {
                    return res
                        .status(404)
                        .json({
                            error:   404,
                            message: 'The specified application does not exist.'
                        });
                }

                application.services = services.filter(function (service) {
                    return application.id == service.application;
                });

                return application;
            })
            .then(function (application) {
                return res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(application);
            })
            .catch(function (err) {
                Log.error('There was a problem retrieving the application.', {
                    context: err
                });

                return res
                    .status(500)
                    .json({
                        error:   500,
                        message: 'There was a problem retrieving the application.'
                    })
            })
            .finally(function () {
                res.end();
            });
    });

    /**
     * Get the services for the specified application
     */
    app.get('/v1/applications/:id/services', function (req, res) {
        Services.all()
            .then(function (services) {
                return services.filter(function (service) {
                    return req.params.id == service.application;
                });
            })
            .then(function (services) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(services);
            })
            .catch(function (err) {
                Log.error('There was a problem retrieving the application\'s services.', {
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
     * Create a new service for the specified application
     */
    app.post('/v1/applications/:id/services', function (req, res) {
        req.body.application = req.params.id;

        Services.create(req.body)
            .then(function (service) {
                var ServiceTemplate = IoC.create('service-templates/' + toCase.pascal(req.body.template));

                return ServiceTemplate.create(service, req.body);
            })
            .then(function (service) {
                res
                    .header('Cache-Control', 'private, max-age=10')
                    .json(service);
            })
            .catch(function (err) {
                Log.error('There was a problem creating the application\'s service.', {
                    message: err.message,
                    stack:   err.stack
                });

                res
                    .status(500)
                    .json({
                        error:   500,
                        message: 'There was a problem creating the application\'s service.'
                    });
            })
            .finally(function () {
                res.end();
            });
    });

    /**
     * Destroy the specified application
     */
    app.delete('/v1/applications/:id', function (req, res) {
        Promise.all([
            Applications.get(req.params.id),
            Services.all()
        ])
            .spread(function (application, services) {
                return Promise.all(services
                    .filter(function(service) {
                        return service.application == application.id;
                    })
                    .map(function (service) {
                        Services.del(service.id);
                    })
                );
            })
            .then(function () {
                return Applications.del(req.params.id);
            })
            .then(function (result) {
                if (result) {
                    res
                        .json({
                            ok: true
                        });
                } else {
                    Log.error('There was a problem deleting the application.');

                    res
                        .status(500)
                        .json({
                            error:   500,
                            message: 'There was a problem deleting the specified application.'
                        });
                }
            })
            .catch(function (err) {
                Log.error('There was an exception that occurred when deleting an application.', {
                    message: err.message,
                    stack:   err.stack
                });

                res
                    .status(404)
                    .json({
                        error:   404,
                        message: 'The specified application could not be found.'
                    });
            })
            .finally(function () {
                res.end();
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config', 'logger', 'models/Applications', 'models/Services'];