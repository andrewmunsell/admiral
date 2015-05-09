/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var express = require('express');

exports = module.exports = function() {
    return express();
};

exports['@singleton'] = true;