/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

exports = module.exports = function(app, config, Log) {
    /**
     * Get all of the current backends for the router
     */
    app.get('/v1/router/backends', function(req, res) {
        return config.getAsync(false, '/vulcand/backends')
            .spread(function(result) {
                res
                    .json((result.node.nodes || []).map(function(node) {
                        return node.key.replace('/vulcand/backends/', '');
                    }));
            })
            .catch(function(err) {
                if (err.errorCode == 100) {
                    res
                        .status(404)
                        .json({
                            error: 404,
                            message: 'The router has not been setup and was not found.'
                        });
                } else {
                    Log.error('There was a problem fetching the backends.', {
                        message: err.message,
                        stack: err.stack
                    });

                    res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem fetching the backends.'
                        });
                }
            });
    });

    /**
     * Get all of the current frontends for the router
     */
    app.get('/v1/router/frontends', function(req, res) {
        return config.getAsync(false, '/vulcand/frontends', { recursive: true })
            .spread(function(result) {
                res
                    .json((result.node.nodes || []).map(function(node) {
                        var j = JSON.parse(node.nodes.filter(function(frontendNode) {
                            return frontendNode.key.match(/frontend$/) != null;
                        })[0].value);

                        j.id = node.key.replace('/vulcand/frontends/', '');

                        return j;
                    }));
            })
            .catch(function(err) {
                if (err.errorCode == 100) {
                    res
                        .status(404)
                        .json({
                            error: 404,
                            message: 'The router has not been setup and was not found.'
                        });
                } else {
                    Log.error('There was a problem fetching the frontends.', {
                        message: err.message,
                        stack: err.stack
                    });

                    res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem fetching the frontends.'
                        });
                }
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config', 'logger'];