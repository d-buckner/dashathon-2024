import { Endpoints } from "@octokit/types";

export type PullRequest =
  Endpoints["GET /repos/{owner}/{repo}/pulls"]["response"]["data"][0];

export type Issue =
  Endpoints["GET /repos/{owner}/{repo}/issues"]["response"]["data"][0];

export type Document = Record<string, unknown> & { id: number };
