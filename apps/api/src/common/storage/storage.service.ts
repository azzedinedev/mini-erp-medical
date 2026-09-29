import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface StoredObject {
  key: string;
  sizeBytes: number;
  checksum: string;
  driver: 'local' | 's3';
}

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

  async put(key: string, content: Buffer): Promise<StoredObject> {
    const checksum = createHash('sha256').update(content).digest('hex');
    const driver = this.config.get<string>('app.storageDriver') ?? 'local';
    if (driver === 's3') {
      // Keep the adapter boundary stable for a MinIO/S3 implementation.
      return { key, sizeBytes: content.byteLength, checksum, driver: 's3' };
    }
    const root = path.resolve(this.config.get<string>('app.storagePath') ?? './storage');
    const target = path.resolve(root, key);
    if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Invalid storage key');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content);
    return { key, sizeBytes: content.byteLength, checksum, driver: 'local' };
  }

  async get(key: string): Promise<Buffer> {
    const root = path.resolve(this.config.get<string>('app.storagePath') ?? './storage');
    const target = path.resolve(root, key);
    if (!target.startsWith(`${root}${path.sep}`)) throw new Error('Invalid storage key');
    return readFile(target);
  }
}
