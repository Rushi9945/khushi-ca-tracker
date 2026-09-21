import os
from PIL import Image, ImageDraw

def create_icon(size, filename):
    img = Image.new('RGB', (size, size), color = '#0B0F19')
    d = ImageDraw.Draw(img)
    d.text((size//2 - 20, size//2 - 10), "Ascend", fill=(255,153,0))
    img.save(f"public/{filename}")

if not os.path.exists("public"):
    os.makedirs("public")

create_icon(192, "pwa-192x192.png")
create_icon(512, "pwa-512x512.png")
print("Icons generated")
