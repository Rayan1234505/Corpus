import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT || "http://localhost:9000";

export const s3Client = new S3Client({
  region: "us-east-1", // Minio fallback
  endpoint,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY || "minioadmin",
  },
  forcePathStyle: true,
});

const BUCKET = process.env.S3_BUCKET || "corpus-pdfs";

export const initS3 = async () => {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET }));
    console.log(`S3 Bucket '${BUCKET}' already exists.`);
  } catch (error: any) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      console.log(`S3 Bucket '${BUCKET}' not found. Creating...`);
      await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET }));
      console.log(`S3 Bucket '${BUCKET}' created successfully.`);
    } else {
      console.error("Error checking S3 bucket:", error);
      throw error;
    }
  }
};

export const uploadPdf = async (
  fileBuffer: Buffer,
  fileName: string,
): Promise<string> => {
  const key = `${Date.now()}-${fileName}`;
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: "application/pdf",
    }),
  );
  return key; // We could return the full URL if needed
};

export const getPdfStream = async (key: string) => {
  const result = await s3Client.send(
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    }),
  );
  return result.Body;
};
