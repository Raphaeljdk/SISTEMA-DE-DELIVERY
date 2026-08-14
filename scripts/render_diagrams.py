"""Render all UML diagram HTML files to PNG using Playwright."""
import os
import sys
from playwright.sync_api import sync_playwright

DIAGRAMS_DIR = "/home/z/my-project/scripts/diagrams"
OUTPUT_DIR = "/home/z/my-project/scripts/diagrams"

# (html_file, output_png, viewport_width, viewport_height)
DIAGRAMS = [
    ("usecase.html",  "usecase.png",  1400, 1000),
    ("class.html",    "class.png",    1500, 1100),
    ("object.html",   "object.png",   1500, 1100),
    ("package.html",  "package.png",  1400, 950),
    ("sequence.html", "sequence.png", 1400, 950),
]

def render_diagrams():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for html_name, png_name, vw, vh in DIAGRAMS:
            html_path = os.path.join(DIAGRAMS_DIR, html_name)
            png_path = os.path.join(OUTPUT_DIR, png_name)
            print(f"Rendering {html_name} -> {png_name} ({vw}x{vh})")
            page = browser.new_page(viewport={"width": vw, "height": vh}, device_scale_factor=2)
            page.goto(f"file://{html_path}")
            page.wait_for_load_state("networkidle")
            # Wait for fonts to load
            page.wait_for_timeout(800)
            page.screenshot(path=png_path, full_page=False, omit_background=False)
            page.close()
            print(f"  ✓ saved to {png_path}")
        browser.close()

if __name__ == "__main__":
    render_diagrams()
    print("\nAll diagrams rendered successfully.")
