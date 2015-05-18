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
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config', 'logger', 'models/Services'];