import logging
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from app.ai.llm.provider import get_llm
from sqlalchemy import text
from app.db.session import engine

logger = logging.getLogger(__name__)

class SQLQueryOutput(BaseModel):
    query: str = Field(description="The executable PostgreSQL query")
    explanation: str = Field(description="Brief explanation of what the query does")

SCHEMA = """
Table: documents
- documents.id (VARCHAR) Primary Key
- documents.title (VARCHAR) Product Title
- documents.content (TEXT) Description
- documents.category (VARCHAR) e.g., STEM, Smart Infrastructure
- documents.metadata_json (JSONB) e.g., {"price_usd": 150}
- documents.created_at (TIMESTAMP)

Table: users
- users.id (VARCHAR) Primary Key
- users.email (VARCHAR)
- users.full_name (VARCHAR)
- users.role (VARCHAR) e.g., admin
- users.organization_id (VARCHAR) Foreign Key
- users.created_at (TIMESTAMP)

Table: organizations
- organizations.id (VARCHAR) Primary Key
- organizations.name (VARCHAR)
- organizations.type (VARCHAR)
- organizations.created_at (TIMESTAMP)

Table: orders
- orders.id (VARCHAR) Primary Key
- orders.organization_id (VARCHAR) Foreign Key
- orders.total_amount (FLOAT)
- orders.status (VARCHAR)
- orders.created_at (TIMESTAMP)

Table: order_items
- order_items.id (VARCHAR) Primary Key
- order_items.order_id (VARCHAR) Foreign Key
- order_items.product_id (VARCHAR) Foreign Key (documents.id)
- order_items.quantity (INTEGER)
- order_items.unit_price (FLOAT)
"""

PROMPT = """
You are an expert PostgreSQL database analyst. 
Given the following database schema, generate a safe read-only SQL query to answer the user's question.

Schema:
{schema}

Rules:
1. ONLY return a raw SQL SELECT statement. No updates or deletes.
2. If accessing JSONB fields like metadata_json->>'price_usd', you MUST cast it correctly using CAST(documents.metadata_json->>'price_usd' AS NUMERIC).
3. Keep queries efficient (use LIMIT if appropriate).
4. Do NOT use `json_agg` or return complex nested JSON structures. Use standard scalar aggregations (COUNT, SUM, AVG).
5. Always alias aggregated columns (e.g., `COUNT(*) as total_count`).
6. DO NOT wrap your response in markdown code blocks (like ```sql or ```json). Output ONLY raw, unformatted JSON.
7. DO NOT use table aliases (e.g., `o`, `org`). You MUST use the exact full table name for every single column reference (e.g., `organizations.name`, NOT `o.name`).
8. GROUP BY RULE: If you use GROUP BY, any column in the SELECT clause that is NOT explicitly listed in the GROUP BY clause MUST be wrapped in an aggregate function (like SUM or AVG). You cannot select expressions like `documents.metadata_json` or `order_items.quantity` without grouping by them or wrapping them in `SUM()`.

Example Output:
{{
  "query": "SELECT organizations.name, SUM(orders.total_amount) AS total_spend FROM orders JOIN organizations ON orders.organization_id = organizations.id GROUP BY organizations.name HAVING SUM(orders.total_amount) > 1000",
  "explanation": "This query joins orders and organizations using full table names to calculate total spend."
}}

User Question: {question}

{format_instructions}
"""

async def generate_and_execute_sql(question: str):
    llm = get_llm()
    parser = JsonOutputParser(pydantic_object=SQLQueryOutput)
    
    from app.db.session import async_session_factory
    
    error_context = ""
    last_error = ""
    last_query = ""
    
    for attempt in range(3):
        dynamic_prompt = PROMPT
        if error_context:
            dynamic_prompt += f"\n\nPREVIOUS ATTEMPT FAILED!\nFailed Query: {last_query}\nDatabase Error: {last_error}\nFix the SQL query to resolve this error."
            
        prompt = PromptTemplate(
            template=dynamic_prompt,
            input_variables=["schema", "question"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        chain = prompt | llm | parser
        
        try:
            logger.info(f"Generating SQL (Attempt {attempt + 1}) for: {question}")
            result = await chain.ainvoke({"schema": SCHEMA, "question": question})
            sql_query = result.get("query")
            explanation = result.get("explanation")
            
            logger.info(f"Executing SQL: {sql_query}")
            
            async with async_session_factory() as session:
                await session.execute(text("SET TRANSACTION READ ONLY"))
                db_result = await session.execute(text(sql_query))
                
                rows = db_result.mappings().all()
                data = [dict(row) for row in rows]
                
                return {
                    "query": sql_query,
                    "explanation": explanation,
                    "data": data
                }
                
        except Exception as e:
            logger.warning(f"NL2SQL Error on attempt {attempt + 1}: {e}")
            last_error = str(e)
            last_query = sql_query if 'sql_query' in locals() else "N/A"
            error_context = "True"
            
    return {"error": f"Failed after 3 attempts. Last error: {last_error}", "query": last_query}
