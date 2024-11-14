'use strict'

const core = require('@actions/core')
const github = require('@actions/github')

const main = async () => {
  const octokit = github.getOctokit(core.getInput(github_token));

  const event = JSON.parse(core.getInput('github_event'));
  if (event.before && event.after) {    // push event
        response = await octokit.rest.repos.compareCommitsWithBaseHead({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            basehead: `${event.before}...${event.after}`
        });
        return response.data.files.map(file => file.filename);
  } else if (event.pull_request && 
            (event.action === 'opened' ||
             event.action === 'synchronize' ||
             event.action === 'reopened')) {
        response = await octokit.rest.pulls.listFiles({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            pull_number: event.pull_request.number
        });
        return response.data.map(file => file.filename);
  }
  return []
}

main().catch(err => core.setFailed(err.message))