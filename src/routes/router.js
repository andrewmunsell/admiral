/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var uuid = require('node-uuid');

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

    /**
     * Create a new frontend
     */
    app.post('/v1/router/frontends', function(req, res) {
        var body = req.body;
        delete body.id;

        var id = uuid.v4();

        return config.setAsync(false, '/vulcand/frontends/' + id + '/frontend', JSON.stringify(body))
            .spread(function(result) {
                var frontend = JSON.parse(result.node.value);
                frontend.id = id;

                res
                    .json(frontend);
            });
    });

    /**
     * Edit and replace the specified frontend
     */
    app.post('/v1/router/frontends/:frontendId', function(req, res) {
        var body = req.body;
        var id = req.params.frontendId;

        delete body.id;

        return config.setAsync(false, '/vulcand/frontends/' + id + '/frontend', JSON.stringify(body))
            .spread(function(result) {
                var frontend = JSON.parse(result.node.value);
                frontend.id = id;

                res
                    .json(frontend);
            });
    });

    /**
     * Delete the specified frontend
     */
    app.delete('/v1/router/frontends/:frontendId', function(req, res) {
        var id = req.params.frontendId;

        return config.delAsync(false, '/vulcand/frontends/' + id, { recursive: true })
            .spread(function(result) {
                res
                    .json({
                        ok: true
                    });
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config', 'logger'];