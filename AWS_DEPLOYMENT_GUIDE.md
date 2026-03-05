# AWS Deployment Guide

Step-by-step guide to deploy the McDonald's Avatar Ordering System on AWS.

**Target architecture**: EC2 t3.micro + RDS db.t4g.micro + CloudFront + DynamoDB
**Estimated monthly cost**: ~$33/month

---

## Prerequisites

- AWS account with admin access
- AWS CLI installed and configured (`aws configure`)
- SSH key pair for EC2 access
- Domain name (optional, can use CloudFront default URL)
- Git installed locally

---

## Phase 1: VPC & Networking

### 1.1 Create VPC

```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=mcdonalds-kiosk-vpc}]'
# Note the VpcId

# Enable DNS hostnames
aws ec2 modify-vpc-attribute --vpc-id <VPC_ID> --enable-dns-hostnames
```

### 1.2 Create Subnets

```bash
# Public subnet (for EC2)
aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block 10.0.1.0/24 --availability-zone <REGION>a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mcdonalds-public}]'

# Private subnet (for RDS)
aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block 10.0.3.0/24 --availability-zone <REGION>a --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mcdonalds-private-a}]'

# Second private subnet (RDS requires 2 AZs)
aws ec2 create-subnet --vpc-id <VPC_ID> --cidr-block 10.0.4.0/24 --availability-zone <REGION>b --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=mcdonalds-private-b}]'
```

### 1.3 Internet Gateway

```bash
aws ec2 create-internet-gateway --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=mcdonalds-igw}]'
aws ec2 attach-internet-gateway --internet-gateway-id <IGW_ID> --vpc-id <VPC_ID>

# Create route table for public subnet
aws ec2 create-route-table --vpc-id <VPC_ID>
aws ec2 create-route --route-table-id <RTB_ID> --destination-cidr-block 0.0.0.0/0 --gateway-id <IGW_ID>
aws ec2 associate-route-table --route-table-id <RTB_ID> --subnet-id <PUBLIC_SUBNET_ID>
```

### 1.4 Security Groups

```bash
# EC2 Security Group
aws ec2 create-security-group --group-name mcdonalds-ec2-sg --description "EC2 kiosk server" --vpc-id <VPC_ID>

# Allow HTTP, HTTPS, SSH
aws ec2 authorize-security-group-ingress --group-id <EC2_SG_ID> --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id <EC2_SG_ID> --protocol tcp --port 443 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id <EC2_SG_ID> --protocol tcp --port 22 --cidr <YOUR_IP>/32

# RDS Security Group
aws ec2 create-security-group --group-name mcdonalds-rds-sg --description "RDS PostgreSQL" --vpc-id <VPC_ID>
aws ec2 authorize-security-group-ingress --group-id <RDS_SG_ID> --protocol tcp --port 5432 --source-group <EC2_SG_ID>
```

---

## Phase 2: RDS PostgreSQL

### 2.1 Create DB Subnet Group

```bash
aws rds create-db-subnet-group \
  --db-subnet-group-name mcdonalds-db-subnets \
  --db-subnet-group-description "Private subnets for RDS" \
  --subnet-ids <PRIVATE_SUBNET_A_ID> <PRIVATE_SUBNET_B_ID>
```

### 2.2 Create RDS Instance

```bash
aws rds create-db-instance \
  --db-instance-identifier mcdonalds-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15 \
  --master-username postgres \
  --master-user-password <STRONG_PASSWORD> \
  --allocated-storage 20 \
  --storage-type gp3 \
  --db-name mcdonalds \
  --vpc-security-group-ids <RDS_SG_ID> \
  --db-subnet-group-name mcdonalds-db-subnets \
  --no-publicly-accessible \
  --backup-retention-period 7
```

Wait for the instance to become available (~5-10 minutes):
```bash
aws rds wait db-instance-available --db-instance-identifier mcdonalds-db
aws rds describe-db-instances --db-instance-identifier mcdonalds-db --query 'DBInstances[0].Endpoint.Address'
# Note the RDS endpoint
```

---

## Phase 3: EC2 Instance

### 3.1 Launch EC2

```bash
aws ec2 run-instances \
  --image-id ami-0c02fb55956c7d316 \
  --instance-type t3.micro \
  --key-name <YOUR_KEY_PAIR> \
  --security-group-ids <EC2_SG_ID> \
  --subnet-id <PUBLIC_SUBNET_ID> \
  --associate-public-ip-address \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=mcdonalds-kiosk}]'
```

### 3.2 Allocate Elastic IP

```bash
aws ec2 allocate-address --domain vpc
aws ec2 associate-address --instance-id <INSTANCE_ID> --allocation-id <EIP_ALLOC_ID>
```

### 3.3 SSH & Install Dependencies

```bash
ssh -i <KEY_FILE>.pem ec2-user@<ELASTIC_IP>

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs

# Install Nginx
sudo yum install -y nginx

# Install PM2
sudo npm install -g pm2

# Install Git
sudo yum install -y git
```

### 3.4 Configure Nginx

```bash
sudo tee /etc/nginx/conf.d/mcdonalds.conf << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX

sudo systemctl enable nginx
sudo systemctl start nginx
```

### 3.5 Deploy the Application

```bash
# Clone the repo
cd /home/ec2-user
git clone https://github.com/stefman1234/McDonalds-Avatar-Ordering-System---AWS-Rebuild.git app
cd app

# Install dependencies
npm install

# Create .env.local
cat > .env.local << 'ENV'
NEXT_PUBLIC_KLLEON_SDK_KEY=APP-pjy6uvOiZf42ycX5ip8C
NEXT_PUBLIC_KLLEON_AVATAR_ID=e1d054ad-a6f8-4359-95bf-3038b8ec97ea
OPENAI_API_KEY=<YOUR_OPENAI_KEY>
DATABASE_URL=postgresql://postgres:<RDS_PASSWORD>@<RDS_ENDPOINT>:5432/mcdonalds?connection_limit=10
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://<YOUR_DOMAIN_OR_CLOUDFRONT_URL>
ENV

# Generate Prisma client and push schema
npm run db:generate
npm run db:push

# Seed the database
npm run db:seed

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "mcdonalds" -- start
pm2 save
pm2 startup  # follow the printed command to enable on boot
```

---

## Phase 4: Secrets Manager

Store sensitive values in AWS Secrets Manager instead of .env.local for production:

```bash
# Store OpenAI key
aws secretsmanager create-secret \
  --name mcdonalds/openai \
  --secret-string "<YOUR_OPENAI_KEY>"

# Store database URL
aws secretsmanager create-secret \
  --name mcdonalds/database \
  --secret-string "postgresql://postgres:<PASSWORD>@<RDS_ENDPOINT>:5432/mcdonalds?connection_limit=10"
```

Update the startup script to pull secrets:
```bash
# In PM2 ecosystem file or startup script
export OPENAI_API_KEY=$(aws secretsmanager get-secret-value \
  --secret-id mcdonalds/openai --query SecretString --output text)
export DATABASE_URL=$(aws secretsmanager get-secret-value \
  --secret-id mcdonalds/database --query SecretString --output text)
```

Note: `NEXT_PUBLIC_*` variables are baked into the build at build time, so they go in `.env.local` before `npm run build`.

---

## Phase 5: DynamoDB Tables

```bash
# Sessions table
aws dynamodb create-table \
  --table-name kiosk-sessions \
  --attribute-definitions AttributeName=sessionId,AttributeType=S \
  --key-schema AttributeName=sessionId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# Enable TTL
aws dynamodb update-time-to-live \
  --table-name kiosk-sessions \
  --time-to-live-specification Enabled=true,AttributeName=expiresAt

# Menu cache table
aws dynamodb create-table \
  --table-name menu-cache \
  --attribute-definitions AttributeName=cacheKey,AttributeType=S \
  --key-schema AttributeName=cacheKey,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

aws dynamodb update-time-to-live \
  --table-name menu-cache \
  --time-to-live-specification Enabled=true,AttributeName=expiresAt
```

---

## Phase 6: CloudFront CDN

### 6.1 Create Distribution

```bash
aws cloudfront create-distribution \
  --origin-domain-name <ELASTIC_IP> \
  --default-cache-behavior '{
    "TargetOriginId": "mcdonalds-ec2",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": ["GET","HEAD","OPTIONS","PUT","POST","PATCH","DELETE"],
    "CachedMethods": ["GET","HEAD"],
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {"Forward": "all"},
      "Headers": {"Quantity": 3, "Items": ["Host","Origin","Accept"]}
    },
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 31536000
  }'
```

For a simpler setup, use the AWS Console:

1. Go to CloudFront > Create Distribution
2. Origin domain: Your Elastic IP or domain
3. Protocol: HTTP only (Nginx handles on EC2)
4. Viewer protocol: Redirect HTTP to HTTPS
5. Allowed HTTP methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
6. Cache policy: CachingDisabled (for API routes) or custom
7. Create distribution

Note the CloudFront domain: `d1234abcdef.cloudfront.net`

### 6.2 Configure Caching

- Static assets (`/_next/static/*`): Cache for 1 year
- API routes (`/api/*`): No caching (pass through)
- Pages: Short cache (60s) or no cache

Create a cache behavior for static assets:
- Path pattern: `/_next/static/*`
- Cache policy: CachingOptimized
- TTL: 31536000 (1 year)

---

## Phase 7: GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ec2-user
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/app
            git pull origin main
            npm install
            npm run build
            pm2 restart mcdonalds
```

Set GitHub Secrets:
- `EC2_HOST`: Your Elastic IP
- `EC2_SSH_KEY`: Contents of your .pem file

---

## Phase 8: SSL Certificate (Optional)

If using a custom domain:

```bash
# On EC2, install certbot
sudo yum install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d kiosk.yourdomain.com

# Auto-renew
sudo certbot renew --dry-run
```

If using CloudFront only, request an ACM certificate:
```bash
aws acm request-certificate \
  --domain-name kiosk.yourdomain.com \
  --validation-method DNS \
  --region us-east-1  # Must be us-east-1 for CloudFront
```

---

## Verification Checklist

After deployment, verify each component:

- [ ] EC2 is running and accessible via SSH
- [ ] Nginx is proxying to port 3000
- [ ] `curl http://<ELASTIC_IP>/api/health` returns 200
- [ ] RDS is accessible from EC2: `psql -h <RDS_ENDPOINT> -U postgres -d mcdonalds`
- [ ] Database has seed data: check menu items exist
- [ ] Application loads at CloudFront URL
- [ ] Klleon avatar initializes and renders
- [ ] Voice ordering works (STT -> NLP -> response)
- [ ] Can add items to cart and complete checkout
- [ ] GitHub Actions deploy succeeds on push to main

---

## Troubleshooting

### EC2 can't connect to RDS
- Check RDS security group allows inbound 5432 from EC2 security group
- Verify RDS is in the same VPC
- Check RDS is in a private subnet with proper routing

### Application won't start
```bash
pm2 logs mcdonalds --lines 50  # Check recent logs
pm2 restart mcdonalds           # Restart
```

### Nginx 502 Bad Gateway
- App isn't running: `pm2 status`
- Wrong port: check Nginx config points to 127.0.0.1:3000

### Klleon avatar not loading
- Check browser console for CORS errors
- Verify `NEXT_PUBLIC_KLLEON_SDK_KEY` is set before build
- Klleon SDK requires HTTPS in production

### Database connection errors
- Check `DATABASE_URL` format: `postgresql://user:pass@host:5432/dbname`
- Verify `connection_limit=10` is in the URL
- Check EC2 -> RDS connectivity: `nc -zv <RDS_ENDPOINT> 5432`

---

## Cost Monitoring

Set up billing alerts:
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name "Monthly-Cost-50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions <SNS_TOPIC_ARN>
```

Expected monthly costs:
| Service | Cost |
|---------|------|
| EC2 t3.micro | ~$8 |
| RDS db.t4g.micro | ~$13 |
| CloudFront | ~$5 |
| DynamoDB | ~$0.01 |
| Secrets Manager | ~$2 |
| CloudWatch | ~$3 |
| OpenAI | ~$2 |
| **Total** | **~$33** |
