/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

exports = module.exports = function(config) {
    var Applications = {
        /**
         * Retrieve all applications
         */
        all: function() {
            return config.getAsync('/applications', { recursive: true })
                .spread(function(result) {
                    return (result.node.nodes || [] ).map(function(node) {
                        return JSON.parse(node.value);
                    });
                })
                .catch(function(err) {
                    if(err.errorCode == 100) {
                        return [];
                    } else {
                        return null;
                    }
                });
        }
    };

    return Applications;
};

exports['@singleton'] = true;
exports['@require'] = ['config'];