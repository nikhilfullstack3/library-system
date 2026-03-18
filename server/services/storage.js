const crypto = require("crypto");
const fs = require("fs/promises");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const uploadsDir = path.join(__dirname, "..", "uploads");
const localMode = !process.env.S3_BUCKET_NAME || !process.env.S3_REGION;

const s3Client = localMode
  ? null
  : new S3Client({
      region: process.env.S3_REGION,
      credentials:
        process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
          : undefined,
    });

function sanitizeName(value = "upload") {
  return String(value).replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function buildObjectKey(file, prefix = "uploads") {
  const extension = path.extname(file.originalname || "") || "";
  return `${prefix}/${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;
}

async function saveToLocal(file, prefix = "uploads") {
  const objectKey = buildObjectKey(file, prefix);
  const fullPath = path.join(uploadsDir, objectKey.replace(/^uploads\//, ""));

  await fs.mkdir(path.dirname(fullPath), { recursive: true });
  await fs.writeFile(fullPath, file.buffer);

  return {
    key: objectKey,
    url: `/uploads/${objectKey.replace(/^uploads\//, "")}`,
    fileName: path.basename(objectKey),
    originalName: sanitizeName(file.originalname),
  };
}

async function saveToS3(file, prefix = "uploads") {
  const key = buildObjectKey(file, prefix);
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype || "application/octet-stream",
    })
  );

  const baseUrl =
    process.env.S3_PUBLIC_BASE_URL ||
    `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com`;

  return {
    key,
    url: `${baseUrl.replace(/\/$/, "")}/${key}`,
    fileName: path.basename(key),
    originalName: sanitizeName(file.originalname),
  };
}

async function saveUpload(file, options = {}) {
  if (!file?.buffer) {
    return null;
  }

  if (localMode) {
    return saveToLocal(file, options.prefix);
  }

  return saveToS3(file, options.prefix);
}

module.exports = {
  saveUpload,
};
