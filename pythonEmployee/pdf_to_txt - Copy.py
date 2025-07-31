import fitz  # PyMuPDF


def pdf_to_text(input_pdf_path, output_txt_path):
    """
    Converts a PDF file to plain text and saves it to a .txt file.

    Args:
        input_pdf_path (str): Path to the input PDF file.
        output_txt_path (str): Path where the text file will be saved.
    """
    # Open the PDF
    doc = fitz.open(input_pdf_path)
    
    # Extract text from each page
    all_text = "\n\n".join([page.get_text() for page in doc])
    
    # Write to .txt file
    with open(output_txt_path, "w", encoding="utf-8") as f:
        f.write(all_text)
    
    print(f"✅ Extracted text saved to {output_txt_path}")

# Example usage:
pdf_to_text("employee_handbook.pdf", "employee_handbook.txt")
