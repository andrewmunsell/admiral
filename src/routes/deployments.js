/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

exports = module.exports = function(app, config, Log, Deployments) {
    /**
     * Get the deployments
     */
    app.get('/v1/deployments', function(req, res) {
        Deployments.all()
            .then(function(services) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(services);
            })
            .catch(function(err) {
                Log.error('There was a problem retrieving the deployments.', {
                    message: err.message,
                    stack: err.stack
                });

                res
                    .status(500)
                    .json({
                        error: 500,
                        message: 'There was a problem retrieving the list of deployments.'
                    });
            })
            .finally(function() {
                res.end();
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config', 'logger', 'models/Deployments'];