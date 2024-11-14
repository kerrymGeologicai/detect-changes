'use strict';

const assert = require('assert');
const core = require('@actions/core');
const github = require('@actions/github');

const testCases = [
    {
        name: 'push event',
        input: {
            event: { before: 'old-sha', after: 'new-sha' },
            files: ['README.md', 'src/utils.js']
        }
    },
    {
        name: 'PR opened',
        input: {
            event: { action: 'opened', pull_request: { number: 123 } },
            files: ['src/index.js', 'package.json']
        }
    },
    {
        name: 'PR synchronize',
        input: {
            event: { action: 'synchronize', pull_request: { number: 123 } },
            files: ['src/index.js', 'package.json']
        }
    },
    {
        name: 'invalid event',
        input: {
            event: { action: 'invalid' },
            files: []
        }
    }
];

function mockOctokit(testCase) {
    const api = {
        rest: {
            pulls: { 
                listFiles: async () => ({ 
                    data: testCase.input.files.map(f => ({ filename: f })) 
                }) 
            },
            repos: { 
                compareCommits: async () => ({ 
                    data: { 
                        files: testCase.input.files.map(f => ({ filename: f })) 
                    } 
                }) 
            }
        }
    };

    return function() {
        return api;
    };
}

async function runTests() {
try {
    github.context = { repo: { owner: 'testowner', repo: 'testrepo' } };
    for (const testCase of testCases) {
        console.log(`\nTesting: ${testCase.name}`);
        const results = { output: null, error: null };
        
        // Set up mocks
        github.getOctokit = mockOctokit(testCase);
        core.getInput = name => name === 'github_event' ? JSON.stringify(testCase.input.event) : 'mock-token';
        core.setOutput = (name, value) => results.output = value;
        core.setFailed = message => results.error = message;

        // Run action
        const { main } = require('./index.js');
        await main();
        const expectedOutput = testCase.input.files.join('\n');
        
        
        assert.strictEqual(
            results.output,
            expectedOutput,
            `${testCase.name}: Changed files mismatch`
        );
    }
    console.log('\nAll tests passed!');
    } catch (error) {
        console.error('\nTest failed:', error);
        process.exit(1);
    }
}

runTests();