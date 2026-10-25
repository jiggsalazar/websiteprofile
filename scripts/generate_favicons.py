"""Rasterize the site's J monogram for search engines and browser fallbacks."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1] / 'static-site'
SCALE = 16
image = Image.new('RGB', (64 * SCALE, 64 * SCALE), '#1c1c1c')
draw = ImageDraw.Draw(image)
points = [(40, 15), (40, 40)]


def curve(a, b, end):
    start = points[-1]
    for i in range(1, 33):
        t = i / 32
        points.append(tuple((1-t)**3 * start[j] + 3*(1-t)**2*t*a[j]
                            + 3*(1-t)*t*t*b[j] + t**3*end[j] for j in (0, 1)))


curve((40, 49), (35, 54), (27, 54))
curve((20, 54), (15, 50), (13, 44))
points.append((21, 40))
curve((22, 44), (24, 46), (27, 46))
curve((31, 46), (32, 44), (32, 40))
points.append((32, 15))
draw.polygon([(round(x*SCALE), round(y*SCALE)) for x, y in points], fill='#ffb900')
draw.ellipse((43*SCALE, 13*SCALE, 51*SCALE, 21*SCALE), fill='#f5f1ec')
image.resize((96, 96), Image.Resampling.LANCZOS).save(ROOT / 'favicon.png')
image.resize((180, 180), Image.Resampling.LANCZOS).save(ROOT / 'apple-touch-icon.png')
image.save(ROOT / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print('Generated PNG, ICO and Apple touch icons from the J monogram.')
