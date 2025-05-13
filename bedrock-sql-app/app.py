from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import psycopg2
import os
import json
import re
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# AWS Bedrock client
bedrock = boto3.client(
    service_name='bedrock-runtime',
    region_name=os.getenv('AWS_REGION'),
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
)

# PostgreSQL connection
def get_pg_connection():
    return psycopg2.connect(
        host=os.getenv('PG_HOST'),
        port=os.getenv('PG_PORT'),
        database=os.getenv('PG_DB'),
        user=os.getenv('PG_USER'),
        password=os.getenv('PG_PASSWORD')
    )

# Replace relative phrases like "last month", "this year"
def replace_relative_dates(question):
    today = datetime.today()

    first_of_this_month = today.replace(day=1)
    last_day_of_last_month = first_of_this_month - timedelta(days=1)
    first_day_of_last_month = last_day_of_last_month.replace(day=1)

    last_year = today.year - 1
    start_of_last_year = datetime(last_year, 1, 1)
    end_of_last_year = datetime(last_year, 12, 31)

    start_of_this_year = datetime(today.year, 1, 1)
    end_of_this_year = datetime(today.year, 12, 31)

    start_of_this_week = today - timedelta(days=today.weekday())
    start_of_last_week = start_of_this_week - timedelta(days=7)
    end_of_last_week = start_of_this_week - timedelta(days=1)
    end_of_this_week = start_of_this_week + timedelta(days=6)

    replacements = [
        (r'\b(last month|from last month)\b',
         f"between '{first_day_of_last_month.strftime('%Y-%m-%d')}' and '{last_day_of_last_month.strftime('%Y-%m-%d')}'"),
        (r'\b(this month|from this month)\b',
         f"between '{first_of_this_month.strftime('%Y-%m-%d')}' and '{(first_of_this_month.replace(month=first_of_this_month.month % 12 + 1, day=1) - timedelta(days=1)).strftime('%Y-%m-%d')}'"),
        (r'\b(last year|from last year|policies from last year)\b',
         f"between '{start_of_last_year.strftime('%Y-%m-%d')}' and '{end_of_last_year.strftime('%Y-%m-%d')}'"),
        (r'\b(this year|from this year)\b',
         f"between '{start_of_this_year.strftime('%Y-%m-%d')}' and '{end_of_this_year.strftime('%Y-%m-%d')}'"),
        (r'\b(last week|from last week)\b',
         f"between '{start_of_last_week.strftime('%Y-%m-%d')}' and '{end_of_last_week.strftime('%Y-%m-%d')}'"),
        (r'\b(this week|from this week)\b',
         f"between '{start_of_this_week.strftime('%Y-%m-%d')}' and '{end_of_this_week.strftime('%Y-%m-%d')}'")
    ]

    for pattern, replacement in replacements:
        question = re.sub(pattern, replacement, question, flags=re.IGNORECASE)

    return question

# Replace "in May", "from April", etc.
def replace_month_names(question):
    months = {
        'january': 1, 'february': 2, 'march': 3, 'april': 4,
        'may': 5, 'june': 6, 'july': 7, 'august': 8,
        'september': 9, 'october': 10, 'november': 11, 'december': 12
    }

    today = datetime.today()
    current_year = today.year

    for month_name, month_num in months.items():
        # Case: "in April 2024" / "from May 2023"
        pattern_explicit_year = rf'\b(in|from)\s+{month_name}\s+(\d{{4}})\b'
        match = re.search(pattern_explicit_year, question, flags=re.IGNORECASE)
        if match:
            year = int(match.group(2))
            first_day = datetime(year, month_num, 1)
            last_day = (datetime(year, month_num + 1, 1) - timedelta(days=1)) if month_num < 12 else datetime(year, 12, 31)
            date_range = f"effective_date BETWEEN '{first_day.strftime('%Y-%m-%d')}' AND '{last_day.strftime('%Y-%m-%d')}'"
            question = re.sub(pattern_explicit_year, date_range, question, flags=re.IGNORECASE)
            continue

        # Case: "April last year"
        pattern_last_year = rf'\b{month_name}\s+last\s+year\b'
        if re.search(pattern_last_year, question, flags=re.IGNORECASE):
            year = current_year - 1
            first_day = datetime(year, month_num, 1)
            last_day = (datetime(year, month_num + 1, 1) - timedelta(days=1)) if month_num < 12 else datetime(year, 12, 31)
            date_range = f"effective_date BETWEEN '{first_day.strftime('%Y-%m-%d')}' AND '{last_day.strftime('%Y-%m-%d')}'"
            question = re.sub(pattern_last_year, date_range, question, flags=re.IGNORECASE)
            continue

        # Case: "April this year"
        pattern_this_year = rf'\b{month_name}\s+this\s+year\b'
        if re.search(pattern_this_year, question, flags=re.IGNORECASE):
            year = current_year
            first_day = datetime(year, month_num, 1)
            last_day = (datetime(year, month_num + 1, 1) - timedelta(days=1)) if month_num < 12 else datetime(year, 12, 31)
            date_range = f"effective_date BETWEEN '{first_day.strftime('%Y-%m-%d')}' AND '{last_day.strftime('%Y-%m-%d')}'"
            question = re.sub(pattern_this_year, date_range, question, flags=re.IGNORECASE)
            continue

        # FINAL Case: "in April" / "from April" → all years → EXTRACT(MONTH FROM effective_date) = 4
        pattern_generic = rf'\b(in|from)\s+{month_name}\b'
        if re.search(pattern_generic, question, flags=re.IGNORECASE):
            # Only match if no explicit year is present anywhere in the question
            if not re.search(r'\b\d{4}\b', question):
                month_filter = f"EXTRACT(MONTH FROM effective_date) = {month_num}"
                question = re.sub(pattern_generic, month_filter, question, flags=re.IGNORECASE)
                continue

    return question





# Final preprocessor combining both
def preprocess_question(question):
    question = replace_month_names(question)
    question = replace_relative_dates(question)
    return question

# Claude prompt builder
def build_prompt(user_question):
    return f"""
Human: You are a SQL assistant. Convert the following natural language question into a SQL query for a PostgreSQL database.
Only return the SQL query. Do not explain anything.

The table is called 'insurance_policies' and has the following columns:
- policy_number (TEXT)
- effective_date (DATE; when the policy was issued)
- transaction_type (TEXT; e.g. New Business, Endorsement)
- insured_state (TEXT; two-letter US state abbreviation)
- coverage (TEXT)
- limit (NUMERIC)
- gross_premium (NUMERIC)
- agent_name (TEXT; the name of the insurance agent)

Use proper PostgreSQL syntax and avoid line breaks or comments.

Question: {user_question}
Assistant:
"""

@app.route("/")
def home():
    return "<h3>Claude SQL API is running. Send a POST to /ask</h3>"

@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    question = data.get("question")

    if not question:
        return jsonify({"error": "Missing 'question' in request body"}), 400

    # Step 0: Preprocess relative date phrases
    question = preprocess_question(question)

    # Step 1: Build Claude prompt
    prompt = build_prompt(question)

    # Step 2: Invoke Claude API to get SQL
    try:
        body = json.dumps({
            "prompt": prompt,
            "max_tokens_to_sample": 500,
            "temperature": 0.2,
            "stop_sequences": ["\n\nHuman:"]
        })

        response = bedrock.invoke_model(
            modelId='anthropic.claude-v2',
            contentType='application/json',
            accept='application/json',
            body=body
        )

        response_body = response['body'].read().decode('utf-8')

        sql_start = response_body.lower().find("select")
        if sql_start == -1:
            raise ValueError("No SQL query found in response.")

        sql_section = response_body[sql_start:]
        sql_only = re.split(r'[\"`\n]*stop_reason', sql_section)[0].strip()
        sql = sql_only.replace('\\n', ' ').replace('\\t', ' ').strip('",` ')
    except Exception as e:
        return jsonify({"error": "Claude API failed", "details": str(e)}), 500

    # Step 3: Execute SQL on PostgreSQL
    try:
        conn = get_pg_connection()
        cur = conn.cursor()
        cur.execute(sql)
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        result = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
    except Exception as e:
        return jsonify({"error": "PostgreSQL query failed", "sql": sql, "details": str(e)}), 500

    return jsonify({"sql": sql, "result": result})

if __name__ == "__main__":
    app.run(debug=True)
