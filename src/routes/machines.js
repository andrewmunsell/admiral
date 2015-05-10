/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

exports = module.exports = function(app, config, fleet) {
    /**
     * Get the machines in the cluster
     */
    app.get('/v1/machines', function(req, res) {
        fleet.list_machinesAsync()
            .then(function(machines) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(machines);
            })
            .catch(function(err) {
                res
                    .status(500)
                    .json({
                        error: 500,
                        message: 'There was a problem fetching the machines.'
                    });
            })
            .finally(function() {
                res.end();
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config', 'fleet'];