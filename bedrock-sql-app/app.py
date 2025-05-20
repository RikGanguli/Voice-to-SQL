from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
import psycopg2
import os
import json
import re
from decimal import Decimal
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
import logging

logging.basicConfig(level=logging.DEBUG)

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
- transaction_type (TEXT; e.g. New, Endorsement)
- insured_state (TEXT; two-letter US state abbreviation)
- coverage (TEXT)
- limit (NUMERIC; represents the coverage limit in dollars)
- gross_premium (NUMERIC; represents the total premium in dollars)

When interpreting phrases like 'above 100000' or 'greater than 1000', apply the correct SQL numeric comparison operators (e.g., '>' for above, '<' for below).

When filtering text columns like 'coverage' or 'insured_state', use case-insensitive comparison (e.g., ILIKE instead of =).

Ensure you generate valid SQL for numeric fields like 'limit' and 'gross_premium'.

Use proper PostgreSQL syntax and avoid line breaks or comments.

If the question mentions "no filter" for a column, do not add any WHERE clause for that column.

Do not invent or assume transaction_type values. Only use known values: New, Renewal, Policy, Endorsement, Reinstate, Cancellation, Audit, Cancel.

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

    print(f"[Incoming Request] Question: {question}")

    if not question:
        print("[Error] Missing 'question' in request body")
        return jsonify({"error": "Missing 'question' in request body"}), 400

    # Step 0: Preprocess relative date phrases
    question = preprocess_question(question)
    print(f"[Preprocessed Question] {question}")

    # Step 1: Build Claude prompt
    prompt = build_prompt(question)
    print(f"[Claude Prompt]\n{prompt}")

    # Step 2: Invoke Claude API to get SQL
    try:
        body = json.dumps({
            "prompt": prompt,
            "max_tokens_to_sample": 500,
            "temperature": 0.2,
            "stop_sequences": ["\n\nHuman:"]
        })

        print(f"[Claude API Request Body]\n{body}")

        response = bedrock.invoke_model(
            modelId='anthropic.claude-v2',
            contentType='application/json',
            accept='application/json',
            body=body
        )

        response_body = response['body'].read().decode('utf-8')
        print(f"[Claude Raw Response Body]\n{response_body}")

        sql_start = response_body.lower().find("select")
        if sql_start == -1:
            print(f"[Error] No SQL query found in Claude response.\nResponse Body: {response_body}")
            raise ValueError("No SQL query found in response.")

        sql_section = response_body[sql_start:]

        # Stop at the first semicolon OR double newline OR 'stop_reason'
        sql_only = re.split(r'(;|\n\n|stop_reason)', sql_section)[0].strip()

        # Remove trailing commentary after FROM/GROUP BY queries
        sql_only = re.split(r'(?:This|Note|Explanation|The result|You can use)', sql_only, flags=re.IGNORECASE)[0].strip()

        # Clean escaped characters
        sql = sql_only.replace('\\n', ' ').replace('\\t', ' ').strip('",` ')

        # Quote reserved keywords like 'limit'
        # Quote 'limit' if used as a column but not in LIMIT clause
        sql = re.sub(
            r'(?<!\bLIMIT\s)\blimit\b(?!\s*\d)', 
            '"limit"', 
            sql, 
            flags=re.IGNORECASE
        )


        # Normalize spaces in SQL to prevent matching issues
        sql_clean = re.sub(r'\s+', ' ', sql).strip()

        # Debug print original SQL
        print(f"[Original Generated SQL]\n{sql_clean}")

        # Apply FROM/SINCE patch if needed
        if re.search(r'\b(from|since)\s+\w+\s+\d{4}\b', question, re.IGNORECASE):
            sql_clean = re.sub(
                r"effective_date\s+(BETWEEN|>=)\s+'(\d{4}-\d{2}-\d{2})'\s+AND\s+effective_date\s+<=\s+'(\d{4}-\d{2}-\d{2})'",
                r"effective_date >= '\2'",
                sql_clean,
                flags=re.IGNORECASE
            )
            print(f"[Post-processed SQL after FROM/SINCE adjustment]\n{sql_clean}")
        else:
            print("[No FROM/SINCE adjustment applied. Original SQL is correct.]")

        # Replace the cleaned SQL back into sql for execution
        sql = sql_clean
        print(f"[Generated SQL]\n{sql}")

        # Handle EXTRACT(YEAR FROM effective_date) = 2024 pattern
        extract_year_match = re.search(r"extract\s*\(\s*year\s+from\s+effective_date\s*\)\s*=\s*(\d{4})", sql, re.IGNORECASE)
        if extract_year_match:
            year = int(extract_year_match.group(1))
            sql = re.sub(
                r"extract\s*\(\s*year\s+from\s+effective_date\s*\)\s*=\s*\d{4}",
                f"effective_date >= '{year}-01-01' AND effective_date < '{year + 1}-01-01'",
                sql,
                flags=re.IGNORECASE
            )
            print(f"[Post-processed SQL after EXTRACT(YEAR) patch]\n{sql}")


    except Exception as e:
        print(f"[Claude API Error] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Claude API failed", "details": str(e)}), 500

    # Step 3: Execute SQL on PostgreSQL
    try:
        print(f"[Executing SQL]\n{sql}")
        conn = get_pg_connection()
        cur = conn.cursor()
        cur.execute(sql)
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        result = []

        # ✅ CASE 1: Scalar result (e.g., SELECT COUNT(*), SUM(...), AVG(...))
        if len(columns) == 1 and len(rows) == 1:
            result.append({columns[0]: rows[0][0]})

        # ✅ CASE 2: Grouped summary (e.g., SELECT field, COUNT(*) ... LIMIT 1)
        elif len(columns) == 2 and len(rows) == 1:
            result.append(dict(zip(columns, rows[0])))

        # ✅ CASE 3: Normal full row output
        else:
            for row in rows:
                row_dict = dict(zip(columns, row))
                if 'effective_date' in row_dict and isinstance(row_dict['effective_date'], (datetime, date)):
                    if row_dict['effective_date'] is not None:
                        row_dict['effective_date'] = row_dict['effective_date'].strftime('%Y-%m-%d')
                result.append(row_dict)


        print(f"[SQL Query Result] Rows Fetched: {len(result)}")
        cur.close()
        conn.close()

    except Exception as e:
        print(f"[PostgreSQL Execution Error] {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": "PostgreSQL query failed", "sql": sql, "details": str(e)}), 500
    
    # Step 4: Determine Chart Type (only if user asked for it)
    chart_type = None
    question_lower = question.lower()

    if any(kw in question_lower for kw in ['chart', 'graph', 'visualize', 'plot', 'distribution', 'trend', 'compare', 'share']):
        if 'line chart' in question_lower or 'trend' in question_lower or 'over time' in question_lower or 'time series' in question_lower:
            chart_type = 'line'
        elif 'bar chart' in question_lower or 'compare' in question_lower or 'comparison' in question_lower:
            chart_type = 'bar'
        elif 'pie chart' in question_lower or 'distribution' in question_lower or 'share' in question_lower or 'proportion' in question_lower:
            chart_type = 'pie'
        else:
            # fallback default
            chart_type = 'bar'

    print(f"[Determined Chart Type] {chart_type}")

    # Step 5: Infer xField & yField (only if chartType is needed)
    x_field = None
    y_field = None

    if chart_type and result:
        result_keys = result[0].keys()
        print(f"[Result Keys] {result_keys}")

        numeric_fields = [k for k in result_keys if isinstance(result[0][k], (int, float, Decimal))]
        string_fields = [k for k in result_keys if isinstance(result[0][k], str)]

        y_field = numeric_fields[0] if numeric_fields else None
        x_field = string_fields[0] if string_fields else None

        print(f"[Inferred xField: {x_field}, yField: {y_field}]")

    return jsonify({
        "sql": sql,
        "result": result,
        "count": len(result), 
        "chartType": chart_type,
        "xField": x_field,
        "yField": y_field
    })



@app.route("/filters", methods=["POST"])
def filters():
    filters_data = request.json

    if not filters_data:
        return jsonify({"error": "Missing filters in request body"}), 400

    conditions = []
    values = []

    if filters_data.get('effectiveFrom'):
        conditions.append("CAST(effective_date AS DATE) >= %s")
        values.append(filters_data['effectiveFrom'])

    if filters_data.get('effectiveTo'):
        conditions.append("CAST(effective_date AS DATE) <= %s")
        values.append(filters_data['effectiveTo'])

    if filters_data.get('transactionType'):
        conditions.append("transaction_type = %s")
        values.append(filters_data['transactionType'])

    if filters_data.get('insuredState'):
        conditions.append("insured_state = %s")
        values.append(filters_data['insuredState'])

    if filters_data.get('coverage'):
        conditions.append("coverage = %s")
        values.append(filters_data['coverage'])

    try:
        # Handle limit range
        limit_min_raw = filters_data.get('limitMin')
        limit_max_raw = filters_data.get('limitMax')

        if limit_min_raw != '' and limit_max_raw != '':
            conditions.append('"limit" BETWEEN %s AND %s')
            values.extend([float(limit_min_raw), float(limit_max_raw)])
        elif limit_min_raw != '':
            conditions.append('"limit" >= %s')
            values.append(float(limit_min_raw))
        elif limit_max_raw != '':
            conditions.append('"limit" <= %s')
            values.append(float(limit_max_raw))

        # Handle gross_premium range
        premium_min_raw = filters_data.get('premiumMin')
        premium_max_raw = filters_data.get('premiumMax')

        if premium_min_raw != '' and premium_max_raw != '':
            conditions.append('gross_premium BETWEEN %s AND %s')
            values.extend([float(premium_min_raw), float(premium_max_raw)])
        elif premium_min_raw != '':
            conditions.append('gross_premium >= %s')
            values.append(float(premium_min_raw))
        elif premium_max_raw != '':
            conditions.append('gross_premium <= %s')
            values.append(float(premium_max_raw))

    except ValueError as e:
        return jsonify({"error": "Invalid numeric filter values", "details": str(e)}), 400

    where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""

    # ✅ ✅ FIXED: Use f-string for SQL interpolation
    sql = f"""
        SELECT
        policy_number,
        effective_date,
        transaction_type,
        insured_state,
        coverage,
        "limit",
        gross_premium
    FROM insurance_policies
    {where_clause}
    LIMIT 100;

    """

    print("Generated SQL:", sql)
    print("With values:", values)

    try:
        conn = get_pg_connection()
        cur = conn.cursor()
        cur.execute(sql, values)
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        result = []
        for row in rows:
            row_dict = dict(zip(columns, row))

            # ✅ Safe check if effective_date exists and is not None
            if 'effective_date' in row_dict and isinstance(row_dict['effective_date'], (datetime, date)):
                if row_dict['effective_date'] is not None:
                    row_dict['effective_date'] = row_dict['effective_date'].strftime('%Y-%m-%d')

            result.append(row_dict)

        cur.close()
        conn.close()
    except Exception as e:
        print("SQL Error:", str(e))
        return jsonify({"error": "PostgreSQL query failed", "sql": sql, "details": str(e)}), 500

    return jsonify({
        "sql": sql, 
        "result": result,
        "count": len(result)
    })


@app.route("/kpis", methods=["GET"])
def get_kpis():
    try:
        conn = get_pg_connection()
        cur = conn.cursor()

        # 1. Total Policies
        cur.execute("SELECT COUNT(*) FROM insurance_policies;")
        total_policies = cur.fetchone()[0]

        # 2. Total Gross Premium
        cur.execute("SELECT COALESCE(ROUND(SUM(gross_premium), 2), 0) FROM insurance_policies;")
        total_gross_premium = cur.fetchone()[0]

        # 3. Average Policy Limit
        cur.execute('SELECT COALESCE(ROUND(AVG("limit"), 2), 0) FROM insurance_policies;')
        avg_policy_limit = cur.fetchone()[0]

        # 4. Policies Issued This Year
        cur.execute("""
            SELECT COUNT(*) FROM insurance_policies 
            WHERE EXTRACT(YEAR FROM effective_date) = EXTRACT(YEAR FROM CURRENT_DATE);
        """)
        policies_this_year = cur.fetchone()[0]

        # 5. Most Common Transaction Type
        cur.execute("""
            SELECT transaction_type FROM insurance_policies 
            GROUP BY transaction_type 
            ORDER BY COUNT(*) DESC 
            LIMIT 1;
        """)
        common_transaction_type = cur.fetchone()[0]

        # 6. Top Insured State
        cur.execute("""
            SELECT insured_state FROM insurance_policies 
            GROUP BY insured_state 
            ORDER BY COUNT(*) DESC 
            LIMIT 1;
        """)
        top_insured_state = cur.fetchone()[0]

        cur.close()
        conn.close()

        # Return KPI data
        return jsonify({
            "totalPolicies": total_policies,
            "totalGrossPremium": f"${total_gross_premium:,.2f}",
            "avgPolicyLimit": f"${avg_policy_limit:,.2f}",
            "policiesThisYear": policies_this_year,
            "commonTransactionType": common_transaction_type,
            "topInsuredState": top_insured_state
        })

    except Exception as e:
        print("KPI Query Error:", str(e))
        return jsonify({"error": "Failed to fetch KPIs", "details": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
