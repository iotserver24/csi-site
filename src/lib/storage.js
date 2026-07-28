import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT || undefined,
  credentials: process.env.S3_ACCESS_KEY_ID ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } : undefined,
})

export async function createUploadUrl(objectKey, contentType) {
  const command = new PutObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey, ContentType: contentType })
  return getSignedUrl(client, command, { expiresIn: 300 })
}

export function deleteObject(objectKey) {
  return client.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: objectKey }))
}

export const publicObjectUrl = key => `${(process.env.S3_PUBLIC_URL || '').replace(/\/$/, '')}/${key}`
