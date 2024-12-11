import {Octokit} from 'octokit';
import {Endpoints, RequestParameters} from '@octokit/types';

const ORG = 'opensearch-project';
const DEFAULT_REPO = 'Opensearch-Dashboards';

// this hurts, but the sdk library doesn't manage response types automatically
type PullRequests = Endpoints['GET /repos/{owner}/{repo}/pulls']['response']['data'];
type ActionsRuns = Endpoints['GET /repos/{owner}/{repo}/actions/runs']['response']['data'];


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
    }

    async getPullRequests() {
        return this.get<PullRequests>('pulls');
    }

    async getWorkflowRuns() {
        const actionsRuns = await this.get<ActionsRuns>('actions/runs');
        return actionsRuns.workflow_runs;
    }

    private async get<T>(path: string, options?: RequestParameters): Promise<T> {
        const response = await this.sdk.request(this.getEndpoint('GET', path), options);
        return response.data;
    }

    private getEndpoint(verb: string, path: string) {
        const repoEndpoint = `/repos/${ORG}/${this.repo}`;
        return `${verb} ${repoEndpoint}/${path}`;
    }
}
