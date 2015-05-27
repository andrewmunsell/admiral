/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var IoC = require('electrolyte');

exports = module.exports = function() {
    IoC.create('routes/index');

    // Applications
    IoC.create('routes/applications');

    // Services
    IoC.create('routes/services');

    // Deployments
    IoC.create('routes/deployments');

    // Machines
    IoC.create('routes/machines');

    // Router
    IoC.create('routes/router');
};

exports['@singleton'] = true;