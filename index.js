'use strict'

const core = require('@actions/core')
const github = require('@actions/github')
const octokit = github.getOctokit(process.env.GITHUB_TOKEN);

const main = async () => {
  const event = JSON.parse(core.getInput('github_event'))

  if (event.before && event.after) {    // push event
        response = await octokit.rest.repos.compareCommitsWithBaseHead({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            basehead: `${event.before}...${event.after}`
        });
        return response.data.files.map(file => file.filename);
  } else if (event.pull_request) {    // pull_request event
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