/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var Fleetctl = require('fleetctl'),
    Promise = require('bluebird');

exports = module.exports = function(nconf) {
    var options = {};

    if(nconf.get('t')) {
        options.tunnel = nconf.get('t');
        options['ssh-username'] = nconf.get('tunnel-username');
    } else {
        options.endpoint = 'http://' + nconf.get('h') + ':' + nconf.get('p');
    }

    var fleetctl = new Fleetctl(options);

    return Promise.promisifyAll(fleetctl);
};

exports['@singleton'] = true;
exports['@require'] = ['nconf'];