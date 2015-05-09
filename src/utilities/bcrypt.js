/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var Promise = require('bluebird'),
    bcrypt = require('bcrypt');

exports = module.exports = function() {
    return Promise.promisifyAll(bcrypt);
};

exports['@singleton'] = true;