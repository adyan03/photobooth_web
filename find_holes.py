"""Get final precise coordinates for desain1 right side and desain2 bottom divider."""
from PIL import Image
import numpy as np

PAPAYA_WHIP = (253, 240, 213)
BORDER_TOL = 12

def check_region(image_path, x_range, y_range, label):
    img = Image.open(image_path).convert('RGB')
    w, h = img.size
    arr = np.array(img, dtype=np.int32)
    
    r, g, b = PAPAYA_WHIP
    is_border = (
        (np.abs(arr[:,:,0] - r) <= BORDER_TOL) &
        (np.abs(arr[:,:,1] - g) <= BORDER_TOL) &
        (np.abs(arr[:,:,2] - b) <= BORDER_TOL)
    )
    
    x1, x2 = x_range
    y1, y2 = y_range
    
    # Check rows in the given x range
    region = is_border[y1:y2, x1:x2]
    row_border_frac = region.mean(axis=1)
    
    print(f"\n{label} - {image_path}")
    print(f"Region: x={x1}-{x2}, y={y1}-{y2}")
    print("Row border fraction (>0.5 = likely separator):")
    for i, frac in enumerate(row_border_frac):
        y = y1 + i
        if frac > 0.3:
            print(f"  y={y}: {frac:.2f}")

# desain1: Check for horizontal divider in right column (x=298-484)
check_region('public/frames/desain1.png', (298, 484), (26, 700), "desain1 right column horizontal dividers")

# desain2: Check for vertical divider in bottom row (y=251-507)
img2 = Image.open('public/frames/desain2.png').convert('RGB')
arr2 = np.array(img2, dtype=np.int32)
r, g, b = PAPAYA_WHIP
is_border2 = (
    (np.abs(arr2[:,:,0] - r) <= BORDER_TOL) &
    (np.abs(arr2[:,:,1] - g) <= BORDER_TOL) &
    (np.abs(arr2[:,:,2] - b) <= BORDER_TOL)
)
region2 = is_border2[251:507, 19:417]
col_border_frac2 = region2.mean(axis=0)
print("\ndesain2 bottom row column border fractions (>0.3):")
for i, frac in enumerate(col_border_frac2):
    x = 19 + i
    if frac > 0.3:
        print(f"  x={x}: {frac:.2f}")
