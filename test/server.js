"use strict";

const assert = require('assert');
const request = require('supertest');
const createApp = require('../lib/app');
const Controller = require('../lib/controller');

suite('Server', () => {
    test('should respond to github-hook endpoint', (done) => {
        const controller = new Controller();
        const config = { githubSecret: 'test-secret', nodeEnv: 'development' };
        const app = createApp(controller, config);

        request(app)
            .post('/github-hook')
            .send({
                action: 'opened',
                number: 123,
                installation: { id: 'test-installation' },
                pull_request: {
                    base: {
                        repo: {
                            full_name: 'test/repo'
                        }
                    }
                },
                sender: {
                    login: 'testuser'
                }
            })
            .expect(200)
            .expect(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) // ISO timestamp format
            .end(done);
    });

    test('should handle unknown request to github-hook', (done) => {
        const controller = new Controller();
        const config = { githubSecret: 'test-secret', nodeEnv: 'development' };
        const app = createApp(controller, config);

        request(app)
            .post('/github-hook')
            .send({
                unknown_payload: 'test'
            })
            .expect(200)
            .expect(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) // Still returns timestamp
            .end(done);
    });

    test('should skip auto-generated changes', (done) => {
        const controller = new Controller();
        const config = { githubSecret: 'test-secret', nodeEnv: 'development' };
        const app = createApp(controller, config);

        request(app)
            .post('/github-hook')
            .send({
                action: 'opened',
                number: 123,
                installation: { id: 'test-installation' },
                pull_request: {
                  base: {
                        repo: {
                            full_name: 'test/repo'
                        }
                    }
                },
                sender: {
                    login: 'pr-preview[bot]'
                }
            })
            .expect(200)
            .expect(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
            .end(done);
    });

    test('should create app successfully with valid config', () => {
        const controller = new Controller();
        const config = { githubSecret: 'test-secret' };
        const app = createApp(controller, config);

        // Just verify we got an express app back
        assert(typeof app.listen === 'function', 'App should have listen method');
        assert(typeof app.use === 'function', 'App should have use method');
    });

    test('should handle race condition when PR is already being processed', (done) => {
        const controller = new Controller();
        const config = { githubSecret: 'test-secret', nodeEnv: 'development' };
        const app = createApp(controller, config);

        const prId = 'test/repo/123';
        const prPayload = {
            action: 'opened',
            number: 123,
            installation: { id: 'test-installation' },
            pull_request: {
                base: {
                    repo: {
                        full_name: 'test/repo'
                    }
                }
            },
            sender: {
                login: 'testuser'
            }
        };

        // Simulate that this PR is already being processed by adding it to currently_running
        controller.currently_running.add(prId);

        // Spy on queuePullRequest to verify race condition is detected
        let raceConditionDetected = false;
        const originalQueuePullRequest = controller.queuePullRequest;
        controller.queuePullRequest = function(payload) {
            return originalQueuePullRequest.call(this, payload).then(result => {
                if (result.error && result.error.raceCondition) {
                    raceConditionDetected = true;
                }
                return result;
            });
        };

        request(app)
            .post('/github-hook')
            .send(prPayload)
            .expect(200)
            .expect(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) // Still returns timestamp
            .end((err) => {
                // Give async processing time to complete
                setTimeout(() => {
                    assert(raceConditionDetected, 'Race condition should have been detected');
                    done(err);
                }, 50);
            });
    });
});