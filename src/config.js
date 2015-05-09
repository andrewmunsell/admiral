/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var Etcd = require('node-etcd');

exports = module.exports = function(nconf) {
    var _etcd = new Etcd(nconf.get('h'), nconf.get('p'));

    return {
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

            return _etcd.del.call(_etcd, arguments);
        }
    };
};

exports['@singleton'] = true;
exports['@require'] = ['nconf'];