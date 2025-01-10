import { Octokit } from "octokit";
import {
  WorkflowRun,
  Issue,
  PullRequest,
  ActionRuns,
  JobRun,
} from "../types.js";
import { RequestInterface, RequestParameters } from "@octokit/types";

const ORG = "opensearch-project";
const DEFAULT_REPO = "Opensearch-Dashboards";
const BACKFILL = process.env.OS_BACKFILL === "true";
const PAGE_SIZE = 100;

type GithubClientConfig = {
  repo?: string;
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
  }

  async getPullRequests() {
    return this.performAction<PullRequest[]>(this.sdk.rest.pulls.list, {
      owner: ORG,
      repo: this.repo,
      state: "all",
      per_page: PAGE_SIZE,
    });
  }

  async getWorkflowRuns(): Promise<WorkflowRun[]> {
    const params: RequestParameters = {
      owner: ORG,
      repo: this.repo,
      event: "pull_request",
      per_page: PAGE_SIZE,
    };

    if (!BACKFILL) {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const startDate = twoWeeksAgo.toISOString();
      params.created = `>=${startDate}`;
    }

    // for this particular API, we get different response schemas for paginated and non-paginated requests.
    const actions = await this.performAction<WorkflowRun[] | ActionRuns>(
      this.sdk.rest.actions.listWorkflowRunsForRepo,
      params
    );

    if ("workflow_runs" in actions) {
      return actions.workflow_runs;
    }

    return actions;
  }

  async getWorkflowJobs(workflow: WorkflowRun): Promise<any[]> {
    const params: RequestParameters = {
      owner: ORG,
      repo: this.repo,
      per_page: PAGE_SIZE,
      run_id: workflow.id,
    };

    const jobs = await this.performAction<JobRun[]>(
      this.sdk.rest.actions.listJobsForWorkflowRun,
      params
    );

    return jobs;
  }

  async getJobs(): Promise<JobRun[]> {
    const workflows = await this.getWorkflowRuns();

    const targetWorkflows = workflows.filter(
      (workflow) =>
        workflow.name === "Run cypress tests" ||
        workflow.name === "Build and test"
    );

    const jobs: JobRun[] = [];

    for (const workflow of targetWorkflows) {
      const job = await this.getWorkflowJobs(workflow);
      jobs.push(...job);
    }

    return jobs;
  }

  async getIssues(): Promise<Issue[]> {
    const response = await this.performAction<Issue[]>(
      this.sdk.rest.issues.listForRepo,
      {
        owner: ORG,
        repo: this.repo,
        state: "all",
        per_page: PAGE_SIZE,
      }
    );

    return response.filter((issue) => !issue.pull_request);
  }

  private async performAction<O>(
    action: RequestInterface,
    params: RequestParameters
  ): Promise<O> {
    if (!BACKFILL) {
      const response = await action(params as any);
      return response.data;
    }

    return this.sdk.paginate(action, params as any) as O;
  }
}
