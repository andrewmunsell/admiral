/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var IoC = require('electrolyte');

exports = module.exports = function() {
    IoC.create('routes/index');

    // Machines
    IoC.create('routes/machines');
};

exports['@singleton'] = true;