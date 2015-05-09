/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

exports = module.exports = function(app) {
    /**
     * Index route
     */
    app.get('/', function(req, res) {
        return res.json({
            name: 'Admiral API'
        });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app'];