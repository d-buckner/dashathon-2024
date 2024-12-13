import chunk from 'lodash.chunk';
import {defaultProvider} from '@aws-sdk/credential-provider-node';
import {Client} from '@opensearch-project/opensearch';
import {AwsSigv4Signer} from '@opensearch-project/opensearch/aws';

const client = new Client({
    ...AwsSigv4Signer({
        region: 'us-west-2',
        service: 'aoss',
        getCredentials: () => {
            const credentialsProvider = defaultProvider();
            return credentialsProvider();
        },
    }),
    node: process.env.OS_ENDPOINT,
});

async function ensureIndexExists(index: string) {
    const existingIndex = await client.indices.exists({index});
    if (!existingIndex.body) {
        await client.indices.create({index});
    }
}

export async function bulkIngest(index: string, documents: Record<string, unknown>[]) {
    await ensureIndexExists(index);

    const chunks = chunk(documents, 100); // ingest at most 100 docs at a time
    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        console.log(`ingesting chunk ${chunkIndex + 1} of ${chunks.length} to ${index}`);
        const chunk = chunks[chunkIndex];
        await client.bulk({
            index,
            body: chunk.reduce((acc, doc) => {
                acc.push({create: {}});
                acc.push(doc);
                return acc;
            }, [] as Record<string, unknown>[])
        })
    }
}

export default client;
