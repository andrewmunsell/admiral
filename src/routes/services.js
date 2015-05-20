/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

exports = module.exports = function(app, config, Log, Services) {
    /**
     * Get the services
     */
    app.get('/v1/services', function(req, res) {
        Services.all()
            .then(function(services) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(services);
            })
            .catch(function(err) {
                Log.error('There was a problem retrieving the services.', {
                    context: err
                });

                res
                    .status(500)
                    .json({
                        error: 500,
                        message: 'There was a problem retrieving the list of services.'
                    });
            })
            .finally(function() {
                res.end();
            });
    });

    /**
     * Change a service's state
     */
    app.post('/v1/services/:id/state', function(req, res) {
        Services.get(req.params.id)
            .then(function(service) {
                if (service == null) {
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
                var ServiceTemplate = IoC.create('service-templates/' + toCase.pascal(service.template));

                switch(req.params.state) {
                    case 'start':
                        return ServiceTemplate.start(service);
                    case 'stop':
                        return ServiceTemplate.stop(service);
                    case 'terminate':
                        return ServiceTemplate.terminate(service);
                    default:
                        return res
                            .status(400)
                            .json({
                                error: 400,
                                message: 'An invalid state was specified.'
                            });
                }
            })
            .then(function(service) {
                return res
                    .header('Cache-Control', 'no-cache')
                    .json(service);
            })
            .catch(function(err) {
                Log.error('There was a problem changing the service\'s state.', {
                    context: err
                });

                res
                    .status(500)
                    .json({
                        error: 500,
                        message: 'There was a problem retrieving the list of services.'
                    });
            })
            .finally(function() {
                res.end();
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config', 'logger', 'models/Services'];