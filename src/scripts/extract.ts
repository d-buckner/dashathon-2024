import "dotenv/config";
import GithubClient from "../clients/GithubClient.js";
import { write } from "../lib/FileOutput.js";

async function extract() {
  const githubClient = new GithubClient();
  // get PRS and write them to output/prs.json
  const pullRequests = await githubClient.getPullRequests();
  await write("prs.json", pullRequests);

  //get issues and write them to output/issues.json
  const issues = await githubClient.getIssues();
  await write("issues.json", issues);
}

extract();
