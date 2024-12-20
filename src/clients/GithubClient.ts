import { Octokit } from "octokit";
import { Endpoints, RequestParameters } from "@octokit/types";
import throttle from "lodash.throttle";

const ORG = "opensearch-project";
const DEFAULT_REPO = "Opensearch-Dashboards";

const THROTTLE_WAIT = 200;

type ActionsRuns =
  Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["response"]["data"];
type ActionJobs =
  Endpoints["GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs"]["response"]["data"];

type GithubClientConfig = {
  repo?: string;
  entireHistory?: boolean;
};

export default class GithubClient {
  config?: GithubClientConfig;
  repo: string;
  sdk: Octokit;

  constructor(config?: GithubClientConfig) {
    this.sdk = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.config = config;
    this.repo = config?.repo ?? DEFAULT_REPO;
    this.get = throttle(this.get.bind(this), THROTTLE_WAIT);
  }

  async getPullRequests() {
    const response = await this.sdk.rest.pulls.list({
      owner: ORG,
      repo: this.repo,
      state: "all",
      per_page: 50,
    });
    return response.data;
  }

  async getWorkflowRuns() {
    const actionsRuns = await this.get<ActionsRuns>("actions/runs");
    return actionsRuns.workflow_runs;
  }

  async getWorkflowJobs(runId: number) {
    const jobsWrapper = await this.get<ActionJobs>(
      `actions/runs/${runId}/jobs`
    );
    return jobsWrapper.jobs;
  }

  async getIssues() {
    const issues = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const response = await this.sdk.rest.issues.listForRepo({
        owner: ORG,
        repo: this.repo,
        state: "all",
        per_page: 100,
        page,
      });
      issues.push(...response.data);
      hasMore = this.config?.entireHistory ? response.data.length === 100 : false;
      page++;
    }

    return issues;
  }

  private async get<T>(path: string, options?: RequestParameters): Promise<T> {
    console.log("Fetching", path);
    const response = await this.sdk.request(
      this.getEndpoint("GET", path),
      options
    );
    return response.data;
  }

  private getEndpoint(verb: string, path: string) {
    const repoEndpoint = `/repos/${ORG}/${this.repo}`;
    return `${verb} ${repoEndpoint}/${path}`;
  }
}
