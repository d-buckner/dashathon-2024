import { Endpoints } from "@octokit/types";

export type PullRequest =
  Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][0];

export type Issue =
  Endpoints["GET /repos/{owner}/{repo}/issues"]["response"]["data"][0];

export type ActionRuns =
  Endpoints["GET /repos/{owner}/{repo}/actions/runs"]["response"]["data"];

export type WorkflowRun =
  ActionRuns["workflow_runs"][0];

export type JobRun = 
 Endpoints["GET /repos/{owner}/{repo}/actions/jobs/{job_id}"]["response"]["data"]

export type Document = Record<string, unknown> & { id: number };
