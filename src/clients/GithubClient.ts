import {Octokit} from 'octokit';
import {Endpoints, RequestParameters} from '@octokit/types';
import throttle from 'lodash.throttle';

const ORG = 'opensearch-project';
const DEFAULT_REPO = 'Opensearch-Dashboards';

const THROTTLE_WAIT = 200;

type ActionsRuns = Endpoints['GET /repos/{owner}/{repo}/actions/runs']['response']['data'];
type ActionJobs = Endpoints['GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs']['response']['data'];


type GithubClientConfig = {
    repo?: string,
};

export default class GithubClient {
    repo: string;
    sdk: Octokit;

    constructor(config?: GithubClientConfig) {
        this.sdk = new Octokit({
            auth: process.env.GITHUB_TOKEN,
        });
        this.repo = config?.repo ?? DEFAULT_REPO;
        this.get = throttle(this.get.bind(this), THROTTLE_WAIT);
    }

    async getPullRequests() {
        return this.sdk.paginate(this.sdk.rest.pulls.list, {
            owner: ORG,
            repo: this.repo,
            state: 'all'
        });
    }

    async getWorkflowRuns() {
        const actionsRuns = await this.get<ActionsRuns>('actions/runs');
        return actionsRuns.workflow_runs;
    }

    async getWorkflowJobs(runId: number) {
        const jobsWrapper = await this.get<ActionJobs>(`actions/runs/${runId}/jobs`);
        return jobsWrapper.jobs;
    }

    private async get<T>(path: string, options?: RequestParameters): Promise<T> {
        console.log('Fetching', path);
        const response = await this.sdk.request(this.getEndpoint('GET', path), options);
        return response.data;
    }

    private getEndpoint(verb: string, path: string) {
        const repoEndpoint = `/repos/${ORG}/${this.repo}`;
        return `${verb} ${repoEndpoint}/${path}`;
    }
}
