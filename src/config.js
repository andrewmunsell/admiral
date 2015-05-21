/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var Promise = require('bluebird'),
    Etcd = require('node-etcd');

exports = module.exports = function(nconf) {
    var _etcd = new Etcd(nconf.get('h'), nconf.get('p'));

    return Promise.promisifyAll({
        /**
         * Get a key, prefixing the key with the global namespace
         * @returns {*}
         */
        get: function() {
            arguments[0] = nconf.get('ns') + arguments[0];

            return _etcd.get.apply(_etcd, arguments);
        },

        /**
         * Set a key to the specified value, prefixing the key with the global namespace
         * @returns {*}
         */
        set: function() {
            arguments[0] = nconf.get('ns') + arguments[0];

            return _etcd.set.apply(_etcd, arguments);
        },

        /**
         * Delete a key, prefixing the key with the global namespace
         * @returns {*}
         */
        del: function() {
            arguments[0] = nconf.get('ns') + arguments[0];

            return _etcd.del.apply(_etcd, arguments);
        },

        /**
         * Make a directory
         * @returns {*}
         */
        mkdir: function() {
            arguments[0] = nconf.get('ns') + arguments[0];

            return _etcd.mkdir.apply(_etcd, arguments);
        },

        /**
         * Remove a directory
         * @returns {*}
         */
        rmdir: function() {
            arguments[0] = nconf.get('ns') + arguments[0];

            return _etcd.rmdir.apply(_etcd, arguments);
        }
    });
};

exports['@singleton'] = true;
exports['@require'] = ['nconf'];