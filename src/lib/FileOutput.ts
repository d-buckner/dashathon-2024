import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import {Document} from '../types.js';

const OUT_DIR = 'output';

export async function write(filename: string, data: Record<string, unknown> | unknown[]) {
    if (!existsSync(OUT_DIR)){
        await fs.mkdir(OUT_DIR);
    }
    const filepath = path.join(OUT_DIR, filename);
    console.log('Writing output to', filepath)
    return fs.writeFile(filepath, JSON.stringify(data, null, 2));
}

export async function read<T extends Document[]>(filename: string): Promise<T> {
    const content = await fs.readFile(path.join(OUT_DIR, filename), 'utf-8');
    return JSON.parse(content);
}

export async function getFileNames(): Promise<string[]> {
    return fs.readdir(OUT_DIR);
}
