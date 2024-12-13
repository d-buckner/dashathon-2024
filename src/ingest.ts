import 'dotenv/config';
import {bulkIngest} from './clients/OpenSearchClient.js';
import {getFileNames, read} from './lib/FileOutput.js';

// ingests all files in ./output and uses their name as the index
async function run() {
    const filenames = await getFileNames();
    await Promise.all(filenames.map(async filename => {
        const docs = await read(filename);
        const indexName = filename.replace('.json', '');
        await bulkIngest(indexName, docs);
    }));
}

run();
