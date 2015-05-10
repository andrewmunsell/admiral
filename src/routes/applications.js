/**
 * @package admiral
 * @author Andrew Munsell <andrew@wizardapps.net>
 * @copyright 2015 WizardApps
 */

var moment = require('moment'),
    uuid = require('node-uuid'),
    validate = require('validate.js');

exports = module.exports = function(app, config) {
    /**
     * Get the applications
     */
    app.get('/v1/applications', function(req, res) {
        config.getAsync('/applications', { recursive: true })
            .spread(function(result) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json((result.node.nodes || [] ).map(function(node) {
                        return JSON.parse(node.value);
                    }));
            })
            .catch(function(err) {
                if(err.errorCode == 100) {
                    res
                        .json([]);
                } else {
                    res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem retrieving the list of applications.'
                        });
                }
            })
            .finally(function() {
                res.end();
            });
    });

    /**
     * Create a new application
     */
    app.post('/v1/applications', function(req, res) {
        var constraints = {
            name: {
                presence: true,
                length: {
                    maximum: 36
                }
            }
        };

        var errors = validate(req.body, constraints);
        if(errors) {
            return res
                .status(400)
                .json(errors)
                .end();
        }

        var id = uuid.v4();

        var app = {
            id: id,
            name: req.body.name,
            createdAt: moment().toISOString()
        };

        config.setAsync('/applications/' + id, JSON.stringify(app))
            .spread(function(result) {
                res
                    .json(JSON.parse(result.node.value));
            })
            .catch(function(err) {
                res
                    .status(500)
                    .json({
                        error: 500,
                        message: 'There was a problem creating the application.'
                    });
            })
            .finally(function() {
                res.end();
            });
    });

    /**
     * Get information for the specified application
     */
    app.get('/v1/applications/:id', function(req, res) {
        config.getAsync('/applications/' + req.params.id)
            .spread(function(result) {
                res
                    .header('Cache-Control', 'private, max-age=60')
                    .json(JSON.parse(result.node.value));
            })
            .catch(function(err) {
                if(err.errorCode == 100) {
                    res
                        .status(404)
                        .json({
                            error: 404,
                            message: 'The specified application doesn\'t exist.'
                        })
                } else {
                    res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem retrieving the applications.'
                        });
                }
            })
            .finally(function() {
                res.end();
            });
    });

    /**
     * Destroy the specified application
     */
    app.delete('/v1/applications/:id', function(req, res) {
        config.getAsync('/applications/' + req.params.id)
            .spread(function(result) {
                return config.delAsync('/applications/' + req.params.id);
            })
            .spread(function(result) {
                res.json({
                    ok: true
                });
            })
            .catch(function(err) {
                if(err.errorCode == 100) {
                    res
                        .status(404)
                        .json({
                            error: 404,
                            message: 'The specified application could not be found.'
                        });
                } else {
                    res
                        .status(500)
                        .json({
                            error: 500,
                            message: 'There was a problem deleting the specified application.'
                        });
                }
            })
            .finally(function() {
                res.end();
            });
    });
};

exports['@singleton'] = true;
exports['@require'] = ['app', 'config'];