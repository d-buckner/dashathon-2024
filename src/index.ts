import 'dotenv/config';
import GithubClient from './clients/GithubClient.js';
import {write} from './clients/FileOutput.js';

async function run() {
    const githubClient = new GithubClient();

    // get PRS and write them to output/prs.json
    const pullRequests = await githubClient.getPullRequests();
    await write('prs.json', pullRequests);

    // get workflow runs and write them to output/workflow-runs.json
    const workflowRuns = await githubClient.getWorkflowRuns();
    await write('workflow-runs.json', workflowRuns);
}

run();
