/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var moment = require('moment'),
    uuid = require('node-uuid'),
    validate = require('validate.js');

exports = module.exports = function(app, config, Applications) {
    /**
     * Get the applications
     */
    app.get('/v1/applications', function(req, res) {
        Applications.all()
            .then(function(applications) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(applications);
            })
            .catch(function(err) {
                res
                    .status(500)
                    .json({
                        error: 500,
                        message: 'There was a problem retrieving the list of applications.'
                    });
            })
            .finally(function() {
                res.end();
            });
    });

    /**
     * Create a new application
     */
    app.post('/v1/applications', function(req, res) {
        Applications.create(req.body)
            .then(function(application) {
                res
                    .json(application);
            })
            .catch(function(errors) {
                return res
                    .status(400)
                    .json(errors)
                    .end();
            });
    });

    /**
     * Get information for the specified application
     */
    app.get('/v1/applications/:id', function(req, res) {
            Applications.get(req.params.id)
                .then(function(application) {
                    if(application == null) {
                        return res
                            .status(404)
                            .json({
                                error: 404,
                                message: 'The specified application does not exist.'
                            });
                    }

                    return res
                        .header('Cache-Control', 'private, max-age=60')
                        .json(application);
                })
                .catch(function(err) {
                    return res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem retrieving the application.'
                        })
                })
                .finally(function() {
                    res.end();
                });
    });

    /**
     * Get the services for the specified application
     */
    app.get('/v1/applications/:id/services', function(req, res) {
        config.getAsync('/services', { recursive: true })
            .spread(function(result) {
                return (result.node.nodes || [] ).map(function(node) {
                    return JSON.parse(node.value);
                });
            })
            .then(function(services) {
                return services.filter(function(service) {
                    return service.application == req.params.id;
                });
            })
            .then(function(services) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(services);
            })
            .catch(function(err) {
                if(err.errorCode == 100 && err.error.cause.indexOf('/services') < 0) {
                    res
                        .status(404)
                        .json({
                            error: 404,
                            message: 'The specified application doesn\'t exist.'
                        });
                } else {
                    res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem retrieving the list of services.'
                        });
                }
            })
            .finally(function() {
                res.end();
            });
    });

    /**
     * Destroy the specified application
     */
    app.delete('/v1/applications/:id', function(req, res) {
        Applications.del(req.params.id)
            .then(function(result) {
                if(result) {
                    res
                        .json({
                            ok: true
                        });
                } else {
                    res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem deleting the specified application.'
                        });
                }
            })
            .catch(function(err) {
                res
                    .status(404)
                    .json({
                        error: 404,
                        message: 'The specified application could not be found.'
                    });
            })
            .finally(function() {
                res.end();
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config', 'models/Applications'];