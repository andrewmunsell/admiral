/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var winston = require('winston');

exports = module.exports = function() {
    return winston;
};

exports['@singleton'] = true;