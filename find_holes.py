from PIL import Image
import numpy as np

img = Image.open('public/frames/frame-film.png').convert('RGB')
arr = np.array(img, dtype=np.int32)
w, h = img.size
print(f"frame-film.png ({w}x{h})")

# Sample pixels in the left film strip zone (x=30-75) that falls inside hole bbox
print("\nLeft film strip zone (x=30-75, various y):")
for y in range(70, 370, 20):
    for x in [30, 40, 50, 60, 70]:
        r, g, b = arr[y, x]
        print(f"  ({x},{y}): RGB({r},{g},{b})")

# Sample right zone (x=270-315)
print("\nRight film strip zone (x=270-315, various y):")
for y in [100, 150, 200, 250, 300]:
    for x in [270, 280, 290, 305, 315]:
        r, g, b = arr[y, x]
        print(f"  ({x},{y}): RGB({r},{g},{b})")
