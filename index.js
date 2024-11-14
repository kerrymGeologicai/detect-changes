'use strict'

const core = require('@actions/core')
const github = require('@actions/github')

const main = async () => {
  const octokit = github.getOctokit(core.getInput('github_token'));

  const event = JSON.parse(core.getInput('github_event'));
  let changedFiles = [];
  if (event.before && event.after) {    // push event
        const response = await octokit.rest.repos.compareCommits({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            base: event.before,
            head: event.after
        });
        changedFiles = response.data.files.map(file => file.filename);
  } else if (event.pull_request && // PR
            (event.action === 'opened' ||
             event.action === 'synchronize' ||
             event.action === 'reopened')) {
        const response = await octokit.rest.pulls.listFiles({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: event.pull_request.number
        });
        changedFiles = response.data.map(file => file.filename);
  }
  core.setOutput('changed_files', changedFiles.join('\n'));
  return null;
}

if (require.main === module) {
    main().catch(err => core.setFailed(err.message));
  }
module.exports = { main };