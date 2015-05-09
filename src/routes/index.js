/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

exports = module.exports = function(app) {
    /**
     * Index route
     */
    app.get('/v1', function(req, res) {
        return res.json({
            name: 'Admiral API',
            version: 1
        });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app'];