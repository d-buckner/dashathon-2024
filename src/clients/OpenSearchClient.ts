import chunk from "lodash.chunk";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { Client } from "@opensearch-project/opensearch";
import { AwsSigv4Signer } from "@opensearch-project/opensearch/aws";
import { Document } from "../types.js";

const client = new Client({
  node: process.env.OS_ENDPOINT,
  auth: {
    username: process.env.OS_USERNAME ?? "", // Set your OpenSearch username
    password: process.env.OS_PASSWORD ?? "", // Set your OpenSearch password
  },
});

async function ensureIndexExists(index: string) {
  const existingIndex = await client.indices.exists({ index });
  if (!existingIndex.body) {
    await client.indices.create({ index });
    console.log(`Index ${index} created`);
  }
}

export async function bulkIngest(index: string, documents: Document[]) {
  try {
    await ensureIndexExists(index);

    const response = await client.helpers.bulk({
      datasource: documents,
      onDocument(doc) {
        // The update operation always requires a tuple to be returned, with the
        // first element being the action and the second being the update options.
        return [
          {
            update: { _index: index, _id: doc.id },
          },
          { doc_as_upsert: true },
        ];
      },
    });

    console.log(response);
  } catch (error) {
    console.error("Error during bulk ingest:", error);
  }
}

export default client;
