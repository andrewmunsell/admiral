/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var nconf = require('nconf')
    .argv({
        'h': {
            describe: 'Host for Etcd',
            alias: 'host',
            default: '127.0.0.1'
        },

        'p': {
            describe: 'Port for Etcd',
            alias: 'port',
            default: 4001
        },

        'ns': {
            describe: 'Root namespace for storing configuration.',
            alias: 'namespace',
            default: '/admiral'
        }
    });

var Etcd = require('node-etcd');

exports = module.exports = function() {
    return new Etcd(nconf.get('h'), nconf.get('p'));
};

exports['@singleton'] = true;