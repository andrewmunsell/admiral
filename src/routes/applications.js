/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

exports = module.exports = function(app, config) {
    /**
     * Get the applications
     */
    app.get('/v1/applications', function(req, res) {
        config.getAsync('/applications', { recursive: true })
            .spread(function(result) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json((result.node.nodes || [] ).map(function(node) {
                        return JSON.parse(node.value);
                    }));
            })
            .catch(function(err) {
                if(err.errorCode == 100) {
                    res
                        .json([]);
                } else {
                    res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem retrieving the list of applications.'
                        });
                }
            })
            .finally(function() {
                res.end();
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config'];