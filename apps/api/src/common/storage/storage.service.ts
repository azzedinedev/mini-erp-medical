import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export interface StoredObject { key: string; sizeBytes: number; checksum: string; driver: 'local' | 's3'; }

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

  async put(key: string, content: Buffer): Promise<StoredObject> {
    const driver = this.config.get<string>('app.storageDriver') === 's3' ? 's3' : 'local';
    if (driver === 's3') {
      // S3/MinIO adapter boundary. Inject an S3 client here in deployments that select STORAGE_DRIVER=s3.
      return { key, sizeBytes: content.byteLength, checksum: createHash('sha256').update(content).digest('hex'), driver };
    }
    const root = resolve(this.config.get<string>('app.storagePath') ?? './storage');
    const filePath = resolve(root, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content);
    return { key, sizeBytes: content.byteLength, checksum: createHash('sha256').update(content).digest('hex'), driver };
  }

  async get(key: string): Promise<Buffer> {
    const root = resolve(this.config.get<string>('app.storagePath') ?? './storage');
    return readFile(resolve(root, key));
  }
}
