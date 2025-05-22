
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

## 🛠️ Getting Started

### 🔁 1. Clone the Repository

```bash
git clone https://github.com/RikGanguli/Voice-to-SQL.git
cd Voice-to-SQL
```

---

## ⚙️ Backend Setup (Flask)

### 📍 Navigate to the backend folder:

```bash
cd bedrock-sql-app
```

### 🧪 Create a virtual environment

#### 🔷 On macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

#### 🟦 On Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate
```

> Make sure Python 3.7+ is installed.

---

### 📦 Install dependencies

```bash
pip install -r requirements.txt
```

---

### 🔐 Configure AWS & DB credentials

1. Copy `.env.template` to `.env`:

```bash
cp .env.template .env         # macOS/Linux
# or
copy .env.template .env       # Windows PowerShell
```

2. Open `.env` and fill in your credentials:

```env
# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1

# PostgreSQL RDS Configuration
PG_HOST=your-rds-endpoint.rds.amazonaws.com
PG_PORT=5432
PG_DATABASE=your-db-name
PG_USER=your-readonly-user
PG_PASSWORD=your-password
```

---

### ▶️ Start the Flask server

```bash
python app.py
```

Flask will run at: [http://localhost:5000](http://localhost:5000)

---

## 🌐 Frontend Setup (React)

### 📍 Navigate to the frontend folder:

```bash
cd Voice-to-SQL/voice-sql-ui
```

### 📦 Install dependencies

```bash
npm install
```

### ▶️ Start the React app

```bash
npm start
```

React will run at: [http://localhost:3000](http://localhost:3000)

---


---

## 🧪 Example Prompts to Test

### 📋 Table Queries

- Show all policies from California
- List renewal policies with premium over 100000
- Get policies issued in April 2025
- What are the new policies from Texas?

### 📊 Chart Prompts

- Show the distribution of policies by coverage
- Compare gross premium by transaction type
- Visualize average policy limit by state over time

### 🔢 Computational Queries

- What is the total number of policies?
- Average policy limit?
- Total gross premium?
- Most common transaction type?
- Top insured state?

---

