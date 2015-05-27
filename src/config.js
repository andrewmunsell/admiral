/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var Promise = require('bluebird'),
    Etcd = require('node-etcd');

exports = module.exports = function(nconf) {
    var _etcd = new Etcd(nconf.get('h'), nconf.get('p'));

    var etcd = {
        /**
         * Get a key, prefixing the key with the global namespace
         * @returns {*}
         */
        get: function() {
            return _etcd.get.apply(_etcd, etcd._processArguments(arguments));
        },

        /**
         * Set a key to the specified value, prefixing the key with the global namespace
         * @returns {*}
         */
        set: function() {
            return _etcd.set.apply(_etcd, etcd._processArguments(arguments));
        },

        /**
         * Delete a key, prefixing the key with the global namespace
         * @returns {*}
         */
        del: function() {
            return _etcd.del.apply(_etcd, etcd._processArguments(arguments));
        },

        /**
         * Make a directory
         * @returns {*}
         */
        mkdir: function() {
            return _etcd.mkdir.apply(_etcd, etcd._processArguments(arguments));
        },

        /**
         * Remove a directory
         * @returns {*}
         */
        rmdir: function() {
            return _etcd.rmdir.apply(_etcd, etcd._processArguments(arguments));
        },

        /**
         * Process the specified arguments, performing the prefixing if requested
         * @param args
         * @returns {*}
         * @private
         */
        _processArguments: function(args) {
            var prefix = true;

            if(typeof(args[0]) == 'boolean') {
                prefix = !!args[0];
                args = Array.prototype.slice.call(args, 1);
            }

            args[0] = (prefix ? nconf.get('ns') : '') + args[0];

            return args;
        }
    };

    return Promise.promisifyAll(etcd);
};

exports['@singleton'] = true;
exports['@require'] = ['nconf'];