/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var SubclassError = require('subclass-error'),
    Promise = require('bluebird');

module.exports = SubclassError('RegistrationNotEnabledError', Promise.OperationalError);