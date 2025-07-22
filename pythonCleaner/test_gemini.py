import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load the API key from .env file
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("❌ GEMINI_API_KEY not found in .env file")

# Configure the SDK
genai.configure(api_key=api_key)

# Use Gemini 1.5 Pro
model = genai.GenerativeModel("gemini-2.5-pro")

print("✅ Gemini 1.5 Pro is ready!")
print("Type your question and press Enter (type 'exit' to quit)\n")

while True:
    user_input = input("You: ")
    if user_input.strip().lower() in {"exit", "quit"}:
        print("👋 Exiting. See you next time!")
        break

    try:
        response = model.generate_content(user_input)
        print("Gemini:", response.text.strip(), "\n")
    except Exception as e:
        print("❌ Error:", str(e), "\n")
