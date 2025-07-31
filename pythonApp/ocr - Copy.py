import os
import google.generativeai as genai
from dotenv import load_dotenv
from PIL import Image

# Load Gemini API Key from .env
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
vision_model = genai.GenerativeModel("gemini-2.5-pro")

def extract_work_orders_from_image(image_path_or_file):
    """
    Extracts work order numbers from an image using Gemini.

    Parameters:
    - image_path_or_file: str or FileStorage object (from Flask)

    Returns:
    - str: Bullet list of extracted work orders or error message
    """
    prompt = """
You are an expert document analyzer.

Please extract all **work order numbers** from the image. The numbers follow this exact format:
- 4-digit number
- A dash "-"
- Followed by exactly 2 digits
- Optionally followed by 1 uppercase letter (no space)

Examples:
- 8292-05
- 4822-08B
- 1234-00
- 8910-24Z

Only include values that match this pattern.
Return the output as a **clean bullet list**, nothing else.
"""

    try:
        # Handle file path or uploaded file object
        image = (
            Image.open(image_path_or_file)
            if isinstance(image_path_or_file, str)
            else Image.open(image_path_or_file.stream)
        )

        response = vision_model.generate_content(
            [prompt, image],
            generation_config={"temperature": 0.2}
        )

        return response.text.strip()

    except Exception as e:
        import traceback
        traceback.print_exc()
        return f"❌ Gemini error: {e}"
