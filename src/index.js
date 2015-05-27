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

// Get the application
var app = IoC.create('app');

// Load the routes
IoC.create('routes');

// Boot the application
app.listen(PORT, function() {
    Log.info('Application listening on port', PORT);
});