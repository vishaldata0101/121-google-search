import os
from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import openai
import requests
from bs4 import BeautifulSoup
import json
import re
from collections import Counter

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")


def get_objective_description(objective_code):
    """Convert objective code to a descriptive text"""
    objectives = {
        "brand_awareness": "Increase brand awareness and recognition",
        "lead_generation": "Generate leads and capture potential customer information",
        "website_traffic": "Drive more traffic to the website",
        "sales": "Increase sales and conversions",
        "app_promotion": "Promote app downloads and usage",
        "local_store_visits": "Drive visits to physical store locations",
        "product_promotion": "Promote specific products to potential customers",
        "service_promotion": "Promote specific services to potential customers"
    }
    return objectives.get(objective_code, "General advertising")

def generate_ad_content(brand_name, category, subcategory, objective, keywords):
    """Generate ad content using OpenAI API"""
    try:
        # Get descriptive text for the objective
        objective_description = get_objective_description(objective)
        
        prompt = f"""
        Create Google Search Ads content for:
        
        Brand: {brand_name}
        Category: {category}
        Subcategory: {subcategory}
        Campaign Objective: {objective_description}
        Keywords: {keywords}
        
        
        Generate:
        1. 10 headlines (each ≤30 characters)
        2. 5 descriptions (each ≤90 characters)
        
        The content should be compelling, include relevant keywords, and highlight the brand's value proposition.
        Focus on the campaign objective: {objective_description}.
        
        Format the response as JSON with 'headlines' and 'descriptions' arrays.
        """
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", 
                 "content": "You are an expert copywriter specializing in Google Search Ads."},
                {"role": "user", "content": prompt}
            ], 
            temperature=0.5,
        )
        
        # Parse the response content as JSON
        content = response.choices[0].message.content
        try:
            # Try to parse as JSON directly
            json_content = json.loads(content)
            return json.dumps(json_content)
        except json.JSONDecodeError:
            # If not valid JSON, extract JSON-like content and parse
            import re
            json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
            if json_match:
                try:
                    json_content = json.loads(json_match.group(1))
                    return json.dumps(json_content)
                except:
                    pass
            
            # If all else fails, create a structured response
            headlines = []
            descriptions = []
            
            # Extract headlines and descriptions using regex
            headline_matches = re.findall(r'"([^"]+)"', content)
            for i, match in enumerate(headline_matches):
                if i < 10:
                    headlines.append(match)
                elif i < 15:
                    descriptions.append(match)
            
            # If regex didn't work, try to extract lines
            if not headlines:
                lines = content.split('\n')
                for line in lines:
                    line = line.strip()
                    if line and not line.startswith(('1.', '2.', '3.', '4.', '5.', '6.', '7.', '8.', '9.', '10.', '•', '-', '*')):
                        if len(line) <= 30 and len(headlines) < 10:
                            headlines.append(line)
                        elif len(line) <= 90 and len(descriptions) < 5:
                            descriptions.append(line)
            
            # Create a structured response
            structured_response = {
                "headlines": headlines[:10],
                "descriptions": descriptions[:5]
            }
            
            return json.dumps(structured_response)
    except Exception as e:
        print(f"Error generating ad content: {e}")
        return json.dumps({"error": str(e), "headlines": [], "descriptions": []})

@app.route('/', methods=['GET'])
def index():
    """Render the home page"""
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate():
    """Generate ad content based on form data"""
    data = request.form
    
    brand_name = data.get('brand_name', '')
    category = data.get('category', '')
    subcategory = data.get('subcategory', '')
    objective = data.get('objective', '')
    keywords = data.get('keywords', '')  

    # Generate ad content
    ad_content_json = generate_ad_content(brand_name, category, subcategory, objective, keywords)
    
    # Parse the JSON string
    try:
        ad_content = json.loads(ad_content_json)
    except:
        ad_content = {"headlines": [], "descriptions": []}
    
    # Add extracted keywords to the response
    
    return json.dumps(ad_content)

if __name__ == '__main__':
    app.run(debug=True) 
