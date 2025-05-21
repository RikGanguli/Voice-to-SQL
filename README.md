
# 🗣️ Voice-to-SQL Insurance Insights Dashboard

An intelligent dashboard that converts natural language or voice queries into real-time SQL using AWS Bedrock (Claude) and PostgreSQL. Designed to deliver fast, insightful analysis of insurance policy data via voice, filters, or manual entry.

---

## 🚀 Features

- 🎤 **Voice-Powered SQL Generation**  
  Ask natural language questions and receive live SQL results using AWS Bedrock (Claude v2).

- 📊 **Smart Chart Visualization**  
  Pie, bar, and line charts rendered based on query context with dynamic titles.

- 🧠 **KPI Highlights**  
  Displays key business metrics like:
  - GWP Issued Today
  - GWP MTD
  - GWP YTD
  - Total Incurred
  - Open Claims Today / MTD / YTD

- 🎯 **Manual Filters + Query Box**  
  Fine-tune insights using manual filters or a dedicated query input.

---

## 🛠️ Tech Stack

- **Frontend**: React, Chart.js, Axios, Web Speech API
- **Backend**: Flask, PostgreSQL, AWS Bedrock (Claude v2)
- **Cloud**: AWS RDS (PostgreSQL), AWS Bedrock

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/voice-to-sql-dashboard.git
cd voice-to-sql-dashboard
```

### 2. Setup Frontend

```bash
cd voice-sql-ui
npm install
npm start
```

### 3. Setup Backend

```bash
cd bedrock-sql-app
pip install -r requirements.txt
python app.py
```

> Ensure your database connection and AWS credentials are properly configured.

---

## 🔐 AWS Credentials

This project uses AWS Bedrock (Claude) to generate SQL from natural language.

### Option 1: Use AWS CLI

```bash
aws configure
```

### Option 2: Use Environment Variables

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_DEFAULT_REGION=us-east-1
```

---

## 🧪 Example Prompts to Test

### 📋 Table Queries

- Show all policies from California
- List renewal policies with premium over 100000
- Get policies issued in April 2025
- What are the new policies from Texas?

### 📊 Chart Prompts

- Show the distribution of policies by coverage as a pie chart
- Compare gross premium by transaction type using a bar chart
- Visualize average policy limit by state over time

### 🔢 Computational Queries

- What is the total number of policies?
- Average policy limit?
- Total gross premium?
- Most common transaction type?
- Top insured state?

---

