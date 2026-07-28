import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT || undefined,
  forcePathStyle: true,
  credentials: process.env.S3_ACCESS_KEY_ID ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } : undefined,
})

export async function createUploadUrl(objectKey: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey, ContentType: contentType })
  return getSignedUrl(client, command, { expiresIn: 300 })
}

/** Server-side put — preferred for admin bulk uploads (avoids browser CORS on R2). */
export async function putObject(objectKey: string, body: Buffer | Uint8Array, contentType: string): Promise<void> {
  await client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: objectKey,
    Body: body,
    ContentType: contentType,
  }))
}

export async function deleteObject(objectKey: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey }))
}

export const publicObjectUrl = (key: string): string => `${(process.env.S3_PUBLIC_URL || '').replace(/\/$/, '')}/${key}`
