import os
from PIL import Image

def resize_icon():
    base_dir = '/home/fr/git/fr/fuelstats-app'
    src_path = os.path.join(base_dir, 'public', 'app_icon.png')
    public_dir = os.path.join(base_dir, 'public')
    
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found.")
        return
        
    img = Image.open(src_path)
    
    # 1. Generate 192x192
    img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'pwa-192x192.png'))
    print("Generated pwa-192x192.png")
    
    # 2. Generate 512x512
    img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'pwa-512x512.png'))
    print("Generated pwa-512x512.png")
    
    # 3. Generate maskable icon (512x512 with safe margin)
    bg_color = img.getpixel((0, 0)) # get corner pixel (typically background)
    
    # If the image is transparent or has alpha, let's use RGBA
    if img.mode == 'RGBA':
        maskable = Image.new('RGBA', (512, 512), bg_color)
        resized = img.resize((384, 384), Image.Resampling.LANCZOS)
        maskable.paste(resized, (64, 64), resized)
    else:
        maskable = Image.new('RGB', (512, 512), bg_color)
        resized = img.resize((384, 384), Image.Resampling.LANCZOS)
        maskable.paste(resized, (64, 64))
        
    maskable.save(os.path.join(public_dir, 'maskable-icon.png'))
    print("Generated maskable-icon.png")

if __name__ == '__main__':
    resize_icon()
