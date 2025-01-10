import { getDeltaMS, msToDays, msToMins } from "../lib/DateUtils.js";
import { read, write } from "../lib/FileOutput.js";
import { Issue, JobRun, PullRequest, WorkflowRun } from "../types.js";

async function transform() {
  Promise.all([
    transformPRs(),
    transformIssues(),
    transformActions(),
    transformJobs(),
  ]);
}

async function transformPRs() {
  const prs = await read<PullRequest[]>("prs.json");
  prs.forEach((pr) => {
    const endDate = pr.closed_at ? new Date(pr.closed_at) : new Date();
    const deltaMS = getDeltaMS(new Date(pr.created_at), endDate);
    // @ts-ignore adding new attribute
    pr["days_open"] = msToDays(deltaMS);
  });
  await write("prs.json", prs);
}

async function transformIssues() {
  const issues = await read<Issue[]>("issues_only.json");
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
  await write("issues_only.json", issues);
}

async function transformActions() {
  const actions = await read<WorkflowRun[]>("actions.json");
  actions.forEach((action) => {
    if (action.status === "completed") {
      const createdAt = new Date(action.created_at);
      const updatedAt = new Date(action.updated_at);
      const run_time = getDeltaMS(createdAt, updatedAt);
      // @ts-ignore adding new attribute
      action["run_time"] = run_time;
      // @ts-ignore adding new attribute
      action["run_time_minutes"] = msToMins(run_time);
    }
  });

  await write("actions.json", actions);
}

async function transformJobs() {
  const jobs = await read<JobRun[]>("jobs.json");
  jobs.forEach((job) => {
    if (job.status === "completed" && job.completed_at) {
      const createdAt = new Date(job.started_at);
      const updatedAt = new Date(job.completed_at);
      const run_time = getDeltaMS(createdAt, updatedAt);
      // @ts-ignore adding new attribute
      job["run_time"] = run_time;
      // @ts-ignore adding new attribute
      job["run_time_minutes"] = msToMins(run_time);

      if (job.conclusion === "failure") {
        const failedStep = job.steps?.find(
          (step) => step.conclusion === "failure"
        );
        if (failedStep) {
          // @ts-ignore adding new attribute
          job["failed_step"] = failedStep.name;
        }
      }
    }
  });

  await write("jobs.json", jobs);
}

transform();
