/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var nconf = require('nconf')
    .argv({
        't': {
            describe: 'Tunnel to use to connect to Fleet.',
            alias: 'tunnel',
            default: null
        },

        'tunnel-username': {
            describe: 'Username to use to connect to Fleet through an SSH tunnel.',
            default: 'core'
        },

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

exports = module.exports = function() {
    return nconf;
};

exports['@singleton'] = true;