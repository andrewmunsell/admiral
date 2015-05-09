/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var express = require('express');

exports = module.exports = function() {
    var app = express();

    app.use(express.static(__dirname + '/../public'));

    return app;
};

exports['@singleton'] = true;