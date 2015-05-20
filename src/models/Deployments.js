/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var moment = require('moment'),
Promise    = require('bluebird'),
uuid       = require('node-uuid'),
validate   = require('validate.js');

exports = module.exports = function (config) {
    var Deployments = {
        /**
         * Retrieve all deployments
         */
        all: function () {
            return config.getAsync('/deployments', {recursive: true})
                .spread(function (result) {
                    return Promise.all((result.node.nodes || [] ).map(function (node) {
                        return config.getAsync(node.key.replace(/^\/admiral/ig, ''), { recursive: true });
                    }));
                })
                .then(function(dirs) {
                    var results = [];

                    for(var i = 0; i < dirs.length; i++) {
                        results = results.concat(dirs[i][0].node.nodes || []);
                    }

                    return results
                        .map(function(result) {
                            return JSON.parse(result.value) || null;
                        }).filter(function(result) {
                            return !!result;
                        });
                })
                .catch(function (err) {
                    if (err.errorCode == 100) {
                        return config.mkdirAsync('/deployments')
                            .then(function() {
                                return [];
                            });
                    } else {
                        return null;
                    }
                });
        }
    };

    return Deployments;
};

exports['@singleton'] = true;
exports['@require'] = ['config'];