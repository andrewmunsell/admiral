/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var express = require('express');
var bodyParser = require('body-parser');

exports = module.exports = function() {
    var app = express();

    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

        next();
    });

    app.use(express.static(__dirname + '/../public'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

    return app;
};

exports['@singleton'] = true;