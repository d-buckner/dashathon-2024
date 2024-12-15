import {read, write} from "../lib/FileOutput.js";
import {PullRequest} from "../types.js";

async function transform() {
    Promise.all([
        transformPRs(),
    ]);
}

async function transformPRs() {
    const prs = await read<PullRequest[]>('prs.json');
    prs.forEach(pr => {
        if (!pr.merged_at) {
            return;
        }
        const msToMerge = new Date(pr.merged_at).getTime() - new Date(pr.created_at).getTime();
        // @ts-ignore adding new attribute
        pr['days_to_merge'] = Number((msToMerge / 86400000).toFixed(2));
    });
    await write('prs.json', prs);
}

transform();
