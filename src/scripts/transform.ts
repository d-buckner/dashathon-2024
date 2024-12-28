import { read, write } from "../lib/FileOutput.js";
import { Issue, PullRequest, Action } from "../types.js";

async function transform() {
  Promise.all([transformPRs(), transformIssues(), transformActions()]);
}

async function transformPRs() {
  const prs = await read<PullRequest[]>("prs.json");
  prs.forEach((pr) => {
    if (!pr.merged_at) {
      return;
    }
    const msToMerge =
      new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime();
    // @ts-ignore adding new attribute
    pr["days_to_merge"] = Number((msToMerge / 86400000).toFixed(2));
  });
  await write("prs.json", prs);
}

async function transformIssues() {
  const issues = await read<Issue[]>("issues.json");
  issues.forEach((issue) => {
    if (issue.closed_at) {
      const msToClose =
        new Date(issue.closed_at).getTime() -
        new Date(issue.created_at).getTime();
      // @ts-ignore adding new attribute
      issue["days_to_close"] = Number((msToClose / 86400000).toFixed(2));
    } else {
      const msToMostRecentResponse =
        new Date(issue.updated_at).getTime() -
        new Date(issue.created_at).getTime();
      // @ts-ignore adding new attribute
      issue["days_to_most_recent_response"] = Number(
        (msToMostRecentResponse / 86400000).toFixed(2)
      );
    }
  });
  await write("issues.json", issues);
}

async function transformActions() {
  const actions = await read<Action[]>("actions.json");
  actions.forEach((action) => {
    if (action.status === "completed") {
      const run_time =
        new Date(action.updated_at).getTime() -
        new Date(action.created_at).getTime();
      // @ts-ignore adding new attribute
      action["run_time"] = run_time;
    }
  });

  await write("actions.json", actions);
}

transform();
