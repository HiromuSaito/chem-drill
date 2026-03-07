import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";
import type { IconStorage } from "../../domain/user/icon-storage.ts";

export class S3IconStorage implements IconStorage {
  private client: S3Client | null = null;

  constructor(
    private getBucketName: () => string,
    private getEndpoint?: () => string | undefined,
  ) {}

  private getClient(): S3Client {
    if (!this.client) {
      const endpoint = this.getEndpoint?.();
      this.client = new S3Client({
        region: "ap-northeast-1",
        ...(endpoint && {
          endpoint,
          forcePathStyle: true,
          credentials: { accessKeyId: "dummy", secretAccessKey: "dummy" },
        }),
      });
    }
    return this.client;
  }

  private key(userId: string): string {
    return `icons/${userId}.webp`;
  }

  async put(userId: string, data: Buffer): Promise<string> {
    const bucket = this.getBucketName();
    const key = this.key(userId);
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const endpoint = this.getEndpoint?.();
    const baseUrl = endpoint
      ? `${endpoint.replace(/\/$/, "")}/${bucket}`
      : `https://${bucket}.s3.ap-northeast-1.amazonaws.com`;
    return `${baseUrl}/${key}?v=${Date.now()}`;
  }

  async delete(userId: string): Promise<void> {
    await this.getClient().send(
      new DeleteObjectCommand({
        Bucket: this.getBucketName(),
        Key: this.key(userId),
      }),
    );
  }

  private candidateKey(userId: string, index: number): string {
    return `icons/${userId}/candidates/${index}.webp`;
  }

  async putCandidate(
    userId: string,
    index: number,
    data: Buffer,
  ): Promise<{ url: string; key: string }> {
    const bucket = this.getBucketName();
    const key = this.candidateKey(userId, index);
    await this.getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    const endpoint = this.getEndpoint?.();
    const baseUrl = endpoint
      ? `${endpoint.replace(/\/$/, "")}/${bucket}`
      : `https://${bucket}.s3.ap-northeast-1.amazonaws.com`;
    const url = `${baseUrl}/${key}?v=${Date.now()}`;
    return { url, key };
  }

  async copyToMain(userId: string, candidateKey: string): Promise<string> {
    const bucket = this.getBucketName();
    const key = this.key(userId);
    await this.getClient().send(
      new CopyObjectCommand({
        Bucket: bucket,
        CopySource: `${bucket}/${candidateKey}`,
        Key: key,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
        MetadataDirective: "REPLACE",
      }),
    );
    const endpoint = this.getEndpoint?.();
    const baseUrl = endpoint
      ? `${endpoint.replace(/\/$/, "")}/${bucket}`
      : `https://${bucket}.s3.ap-northeast-1.amazonaws.com`;
    return `${baseUrl}/${key}?v=${Date.now()}`;
  }

  async deleteCandidates(keys: string[]): Promise<void> {
    const bucket = this.getBucketName();
    await Promise.all(
      keys.map((key) =>
        this.getClient().send(
          new DeleteObjectCommand({
            Bucket: bucket,
            Key: key,
          }),
        ),
      ),
    );
  }
}
