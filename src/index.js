/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var PORT = process.env.PORT || 3000;

// Initialize the IoC container
var IoC = require('electrolyte');
IoC.loader(IoC.node('src'));

// Get the logger
var Log = IoC.create('logger');

var express = require('express');
var app = express();

app.listen(PORT, function() {
    Log.info('Application listening on port', PORT);
});