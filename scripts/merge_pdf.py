"""Merge cover PDF + body PDF into final delivery PDF, then add metadata."""
import os
import sys
from pypdf import PdfReader, PdfWriter

COVER_PDF = "/home/z/my-project/scripts/cover.pdf"
BODY_PDF = "/home/z/my-project/scripts/body.pdf"
OUTPUT_PDF = "/home/z/my-project/download/Projeto_UML_Food_Delivery_System.pdf"

A4_W, A4_H = 595.28, 841.89  # A4 in points

def normalize_page_to_a4(page):
    """Scale a page to A4 if its dimensions don't match exactly."""
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    # Force scale if more than 0.5pt off
    if abs(w - A4_W) > 0.5 or abs(h - A4_H) > 0.5:
        page.scale_to(A4_W, A4_H)
        # Also update mediabox directly to ensure consistency
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (A4_W, A4_H)
    return page

def merge_pdfs():
    print(f"Merging cover + body → {OUTPUT_PDF}")
    writer = PdfWriter()

    # Add cover as page 1
    cover_reader = PdfReader(COVER_PDF)
    print(f"  Cover: {len(cover_reader.pages)} page(s), size: {float(cover_reader.pages[0].mediabox.width):.1f}x{float(cover_reader.pages[0].mediabox.height):.1f}pt")
    for page in cover_reader.pages:
        writer.add_page(normalize_page_to_a4(page))

    # Add body pages
    body_reader = PdfReader(BODY_PDF)
    print(f"  Body: {len(body_reader.pages)} page(s)")
    for page in body_reader.pages:
        writer.add_page(normalize_page_to_a4(page))

    # Set metadata
    writer.add_metadata({
        '/Title': 'Projeto de Modelagem UML - Food Delivery System',
        '/Author': 'Z.ai',
        '/Creator': 'Z.ai',
        '/Subject': 'Documentacao tecnica de modelagem UML para sistema de delivery de comida',
        '/Keywords': 'UML, Engenharia de Software, Food Delivery, Modelagem, Diagramas',
    })

    # Ensure output dir exists
    os.makedirs(os.path.dirname(OUTPUT_PDF), exist_ok=True)
    with open(OUTPUT_PDF, 'wb') as f:
        writer.write(f)

    size_kb = os.path.getsize(OUTPUT_PDF) / 1024
    total_pages = len(cover_reader.pages) + len(body_reader.pages)
    print(f"  ✓ Final PDF: {total_pages} pages, {size_kb:.1f} KB")
    print(f"  Saved to: {OUTPUT_PDF}")

if __name__ == "__main__":
    merge_pdfs()
