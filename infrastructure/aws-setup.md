# AWS Setup Guide (One-Time)

Do these steps once in the AWS Console. After this, `git push main` handles everything automatically.

Replace `REGION` with your chosen region (e.g. `ap-south-1` for India, `us-east-1` for US).
Replace `ACCOUNT_ID` with your 12-digit AWS account ID.
Replace `yourdomain.com` with your actual domain.

---

## 1. ECR — Container Registry

1. Go to **ECR** → Create repository
2. Name: `library-system-backend`
3. Keep defaults → Create
4. Note the URI: `ACCOUNT_ID.dkr.ecr.REGION.amazonaws.com/library-system-backend`

---

## 2. EC2 — MongoDB Instance

1. Go to **EC2** → Launch Instance
2. Name: `library-system-mongodb`
3. AMI: **Ubuntu 24.04 LTS**
4. Instance type: **t3.micro** (~$8/month)
5. Create a new key pair — download the `.pem` file, keep it safe
6. Security group: allow SSH (port 22) from your IP only
7. Storage: 20 GB gp3
8. Launch

### Install MongoDB on the instance:
```bash
ssh -i your-key.pem ubuntu@EC2_PUBLIC_IP

# Install MongoDB 7
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable mongod && sudo systemctl start mongod

# Create a database user
mongosh
use library-system
db.createUser({ user: "libadmin", pwd: "STRONG_PASSWORD_HERE", roles: [{ role: "readWrite", db: "library-system" }] })
exit

# Enable auth
sudo nano /etc/mongod.conf
# Change: security: \n  authorization: enabled
# Change bindIp to: bindIp: 127.0.0.1,EC2_PRIVATE_IP

sudo systemctl restart mongod
```

### Migrate data from Atlas:
```bash
# On your local machine (needs mongodump installed)
mongodump --uri "your-atlas-connection-string" --out ./dump
mongorestore --uri "mongodb://libadmin:STRONG_PASSWORD@EC2_PUBLIC_IP:27017/library-system?authSource=library-system" ./dump/library-system
```

Your `MONGODB_URI` will be:
`mongodb://libadmin:STRONG_PASSWORD@EC2_PRIVATE_IP:27017/library-system?authSource=library-system`

(Use private IP — ECS and EC2 will be in the same VPC)

---

## 3. Security Groups

### ALB Security Group (`alb-sg`)
- Inbound: 443 from `0.0.0.0/0` (HTTPS)
- Inbound: 80 from `0.0.0.0/0` (HTTP → redirects to HTTPS)

### ECS Security Group (`ecs-sg`)
- Inbound: 5001 from `alb-sg` only

### MongoDB Security Group (edit the EC2 instance's SG)
- Add inbound: 27017 from `ecs-sg`
- Remove SSH from `0.0.0.0/0` → change to your IP only

---

## 4. ACM — SSL Certificates

1. Go to **ACM** → Request certificate → Public certificate
2. Add domains: `api.yourdomain.com` and `app.yourdomain.com`
3. DNS validation → Create records in Route 53 (button appears automatically if your domain is in Route 53)
4. Wait ~5 minutes for validation

**Note**: For CloudFront, also request a cert in `us-east-1` region (CloudFront only accepts `us-east-1` certs). Add the same domains.

---

## 5. ALB — Load Balancer

1. Go to **EC2** → Load Balancers → Create → Application Load Balancer
2. Name: `library-system-alb`, internet-facing, IPv4
3. Select all availability zones in your VPC
4. Security group: `alb-sg`
5. **Listeners**:
   - HTTP 80 → action: Redirect to HTTPS 443
   - HTTPS 443 → action: Forward to target group (create new)
6. **Target group**: 
   - Name: `library-system-backend`
   - Target type: IP
   - Protocol: HTTP, Port: 5001
   - Health check path: `/health`
   - Healthy threshold: 2, Unhealthy: 3, Interval: 30s
7. Create ALB → note the DNS name

---

## 6. ECS — Cluster + Service

### Create Cluster
1. Go to **ECS** → Clusters → Create
2. Name: `library-system`, Fargate infrastructure → Create

### IAM Roles (create before task definition)

**Task Role** (`library-system-task-role`):
- Go to IAM → Roles → Create → AWS service → ECS Task
- Add inline policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_S3_UPLOADS_BUCKET/*"
    },
    {
      "Effect": "Allow",
      "Action": ["ssm:GetParameters"],
      "Resource": "arn:aws:ssm:REGION:ACCOUNT_ID:parameter/library-system/prod/*"
    }
  ]
}
```

**Execution Role** (`library-system-execution-role`):
- Create → AWS service → ECS Task
- Attach managed policy: `AmazonECSTaskExecutionRolePolicy`
- Add inline policy for SSM (same as above)

### Update task-definition.json
Replace all `ACCOUNT_ID`, `REGION` placeholders in `infrastructure/task-definition.json`.

### Register Task Definition
```bash
aws ecs register-task-definition \
  --cli-input-json file://infrastructure/task-definition.json \
  --region REGION
```

### Create ECS Service
1. Go to your cluster → Services → Create
2. Launch type: Fargate
3. Task definition: `library-system-backend`
4. Service name: `library-system-backend`
5. Desired tasks: 1
6. Networking: your VPC, select subnets, security group: `ecs-sg`
7. Load balancer: select the ALB, listener 443, target group `library-system-backend`
8. Deployment: Rolling update, min 100%, max 200%
9. Create

---

## 7. Parameter Store — Secrets

Go to **Systems Manager** → Parameter Store → Create parameter for each:

| Name | Type | Value |
|---|---|---|
| `/library-system/prod/MONGODB_URI` | SecureString | `mongodb://libadmin:PASS@EC2_PRIVATE_IP:27017/library-system?authSource=library-system` |
| `/library-system/prod/SESSION_SECRET` | SecureString | random 64-char string |
| `/library-system/prod/QR_SECRET` | SecureString | random 32-char string |
| `/library-system/prod/S3_BUCKET_NAME` | SecureString | your S3 uploads bucket name |
| `/library-system/prod/S3_PUBLIC_BASE_URL` | SecureString | your S3 public URL |

---

## 8. S3 + CloudFront — Web Client

### S3 Bucket
1. Create bucket: `library-system-web-client` (or any name)
2. Block all public access: ON
3. No static website hosting needed

### CloudFront Distribution
1. Go to **CloudFront** → Create distribution
2. Origin: select your S3 bucket, use OAC (Origin Access Control) — create new OAC
3. Copy the bucket policy it shows you → paste into S3 bucket policy
4. Viewer protocol: Redirect HTTP to HTTPS
5. Custom domain: `app.yourdomain.com`
6. ACM certificate: select the `us-east-1` cert
7. Default root object: `index.html`
8. **Error pages**: Add custom error response:
   - HTTP error 403 → response `/index.html`, HTTP 200 (needed for React Router)
   - HTTP error 404 → response `/index.html`, HTTP 200
9. Create → note the distribution ID

---

## 9. Route 53 — DNS

1. Go to **Route 53** → your hosted zone
2. Create record: `api.yourdomain.com` → A record → Alias → ALB
3. Create record: `app.yourdomain.com` → A record → Alias → CloudFront distribution

---

## 10. GitHub Actions — OIDC Setup

### Create OIDC Provider (once per account)
1. Go to **IAM** → Identity providers → Add provider
2. Provider type: OpenID Connect
3. Provider URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`

### Create GitHub Actions Role
1. IAM → Roles → Create → Web identity
2. Identity provider: `token.actions.githubusercontent.com`
3. Audience: `sts.amazonaws.com`
4. GitHub org: your GitHub username, Repo: `library-system`, Branch: `main`
5. Name: `library-system-github-actions`
6. Add inline policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ecr:GetAuthorizationToken"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["ecr:BatchCheckLayerAvailability", "ecr:GetDownloadUrlForLayer", "ecr:BatchGetImage", "ecr:PutImage", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload"],
      "Resource": "arn:aws:ecr:REGION:ACCOUNT_ID:repository/library-system-backend"
    },
    {
      "Effect": "Allow",
      "Action": ["ecs:RegisterTaskDefinition", "ecs:DescribeTaskDefinition", "ecs:DescribeServices", "ecs:UpdateService"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["iam:PassRole"],
      "Resource": ["arn:aws:iam::ACCOUNT_ID:role/library-system-task-role", "arn:aws:iam::ACCOUNT_ID:role/library-system-execution-role"]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::library-system-web-client", "arn:aws:s3:::library-system-web-client/*"]
    },
    {
      "Effect": "Allow",
      "Action": ["cloudfront:CreateInvalidation"],
      "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
    }
  ]
}
```

### Add GitHub Secrets
Go to your repo → Settings → Secrets → Actions → New secret:

| Secret | Value |
|---|---|
| `AWS_ROLE_ARN` | `arn:aws:iam::ACCOUNT_ID:role/library-system-github-actions` |
| `AWS_REGION` | e.g. `ap-south-1` |
| `ECR_REPOSITORY` | `library-system-backend` |
| `ECS_CLUSTER` | `library-system` |
| `ECS_SERVICE` | `library-system-backend` |
| `VITE_API_URL` | `https://api.yourdomain.com/api` |
| `WEB_S3_BUCKET` | `library-system-web-client` |
| `CLOUDFRONT_DISTRIBUTION_ID` | from CloudFront console |
| `EXPO_TOKEN` | from expo.dev account settings |
| `EXPO_PUBLIC_API_URL` | `https://api.yourdomain.com/api` |

---

## Done!

After this setup, every `git push main`:
- Changes in `server/` → auto builds Docker image, pushes to ECR, deploys to ECS (rolling, no downtime)
- Changes in `client/` → auto builds React app, uploads to S3, invalidates CloudFront cache
- Changes in `mobile/` → auto publishes OTA update via EAS
