/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var PORT = process.env.PORT || 3000;

// Initialize the IoC container
var IoC = require('electrolyte');
IoC.loader(IoC.node('src'));

var express = require('express');
var app = express();

app.listen(PORT, function() {
    console.log('Application listening on port', PORT);
});