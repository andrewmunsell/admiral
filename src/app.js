/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var express = require('express');
var bodyParser = require('body-parser');

exports = module.exports = function() {
    var app = express();

    app.use(express.static(__dirname + '/../public'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    return app;
};

exports['@singleton'] = true;