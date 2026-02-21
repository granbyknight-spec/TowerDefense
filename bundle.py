#!/usr/bin/env python3
"""
Bundles the Puppy Defender game into a single self-contained HTML file.

Reads index.html, replaces the CSS <link> with an inline <style> tag,
and replaces all <script src="..."> tags with a single inline <script> tag
containing all JS files concatenated in the correct order.
"""

import os
import re

BASE_DIR = "/home/user/TowerDefense"

# JS files in dependency order (matches the script tag order in index.html)
JS_FILES = [
    "js/config.js",
    "js/utils.js",
    "js/pathfinding.js",
    "js/grid.js",
    "js/enemy.js",
    "js/tower.js",
    "js/projectile.js",
    "js/wave.js",
    "js/renderer.js",
    "js/ui.js",
    "js/game.js",
]

CSS_FILE = "css/style.css"
OUTPUT_FILE = "index-bundle.html"


def read_file(relative_path):
    full_path = os.path.join(BASE_DIR, relative_path)
    with open(full_path, "r", encoding="utf-8") as f:
        return f.read()


def main():
    # Read the HTML template
    html = read_file("index.html")

    # Read CSS content
    css_content = read_file(CSS_FILE)

    # Replace the CSS <link> tag with an inline <style> block
    css_link_pattern = r'<link\s+rel="stylesheet"\s+href="css/style\.css"\s*/?>'
    inline_style = f"<style>\n{css_content}\n    </style>"
    html = re.sub(css_link_pattern, inline_style, html)

    # Read and concatenate all JS files
    js_parts = []
    for js_file in JS_FILES:
        content = read_file(js_file)
        js_parts.append(f"// === {js_file} ===\n{content}")
    combined_js = "\n\n".join(js_parts)

    # Remove all individual <script src="js/..."> tags and replace with one inline block
    # First, remove all script tags referencing js/ files
    script_tag_pattern = r'\s*<script\s+src="js/[^"]+"></script>'
    # Find all matches to know positions
    matches = list(re.finditer(script_tag_pattern, html))

    if matches:
        # Replace from the first script tag to the last script tag with one inline block
        first_match_start = matches[0].start()
        last_match_end = matches[-1].end()

        inline_script = f"\n    <script>\n{combined_js}\n    </script>"

        html = html[:first_match_start] + inline_script + html[last_match_end:]

    # Write the bundled output
    output_path = os.path.join(BASE_DIR, OUTPUT_FILE)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"Bundled {len(JS_FILES)} JS files and 1 CSS file into {output_path}")
    print(f"Output size: {os.path.getsize(output_path):,} bytes")


if __name__ == "__main__":
    main()
