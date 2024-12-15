import chunk from 'lodash.chunk';
import {defaultProvider} from '@aws-sdk/credential-provider-node';
import {Client} from '@opensearch-project/opensearch';
import {AwsSigv4Signer} from '@opensearch-project/opensearch/aws';
import {Document} from '../types.js';

const client = new Client({
    ...AwsSigv4Signer({
        region: 'us-west-2',
        service: 'aoss',
        getCredentials: defaultProvider(),
    }),
    node: process.env.OS_ENDPOINT,
});

async function ensureIndexExists(index: string) {
    const existingIndex = await client.indices.exists({index});
    if (!existingIndex.body) {
        await client.indices.create({index});
    }
}

export async function bulkIngest(index: string, documents: Document[]) {
    await ensureIndexExists(index);

    const response = await client.helpers.bulk({
        datasource: documents,
        onDocument (doc) {
            // The update operation always requires a tuple to be returned, with the
            // first element being the action and the second being the update options.
            return [
              {
                update: { _index: index, _id: doc.id }
              },
              { doc_as_upsert: true }
            ]
          }
    });

    console.log(response);
}

export default client;
