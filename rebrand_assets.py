"""
MotorCare Rebrand Script
Menghasilkan semua aset branding dari baru.jpeg
"""

import sys
import os
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps

# Paksa stdout UTF-8 agar tidak error di Windows
sys.stdout.reconfigure(encoding='utf-8')

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
SOURCE = os.path.join(ASSETS_DIR, "baru.jpeg")

def open_source():
    img = Image.open(SOURCE).convert("RGBA")
    return img

def save_png(img, name, size):
    """Resize dan simpan sebagai PNG."""
    resized = img.resize(size, Image.LANCZOS)
    out_path = os.path.join(ASSETS_DIR, name)
    resized.save(out_path, "PNG", optimize=True)
    print(f"  [OK] {name} ({size[0]}x{size[1]}px) -> {out_path}")
    return out_path

def make_icon_png():
    """icon.png — 1024x1024, background putih (baru.jpeg sudah pakai rounded corners)."""
    img = open_source()
    # Pastikan background putih
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    final = bg.convert("RGB")
    final_rgba = final.convert("RGBA")
    save_png(final_rgba, "icon.png", (1024, 1024))

def make_adaptive_icon_png():
    """adaptive-icon.png — 1024x1024 foreground, background transparan.
    Expo akan gunakan ini sebagai foreground di atas background warna."""
    img = open_source()
    # Buat dengan sedikit padding (safe zone Android ~108dp inner dari 216dp)
    # Beri padding 12% agar tidak terpotong di berbagai shape mask
    pad_ratio = 0.12
    new_size = 1024
    inner_size = int(new_size * (1 - 2 * pad_ratio))
    resized = img.resize((inner_size, inner_size), Image.LANCZOS)
    canvas = Image.new("RGBA", (new_size, new_size), (255, 255, 255, 0))
    offset = (new_size - inner_size) // 2
    canvas.paste(resized, (offset, offset), resized.split()[3])
    save_png(canvas, "adaptive-icon.png", (1024, 1024))

def make_splash_icon_png():
    """splash-icon.png — 288x288 (ukuran logo di splash screen)."""
    img = open_source()
    # Background putih, logo di tengah
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    save_png(bg, "splash-icon.png", (288, 288))

def make_favicon_png():
    """favicon.png — 48x48 untuk web."""
    img = open_source()
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    save_png(bg, "favicon.png", (48, 48))

def make_brand_preview_png():
    """motorcare-brand-preview.png — 1200x630 banner preview (OG image)."""
    img = open_source()
    bg = Image.new("RGBA", img.size, (255, 255, 255, 255))
    bg.paste(img, mask=img.split()[3])
    logo_resized = bg.resize((630, 630), Image.LANCZOS).convert("RGBA")
    
    # Canvas banner 1200x630, background gelap elegan
    canvas = Image.new("RGBA", (1200, 630), (15, 17, 26, 255))
    
    # Paste logo di sisi kanan, centered vertically
    logo_x = 1200 - 630
    logo_y = 0
    canvas.paste(logo_resized, (logo_x, logo_y), logo_resized.split()[3])
    
    # Simpan
    out_path = os.path.join(ASSETS_DIR, "motorcare-brand-preview.png")
    canvas.save(out_path, "PNG", optimize=True)
    print(f"  [OK] motorcare-brand-preview.png (1200x630px) -> {out_path}")

def make_notification_icon_png():
    """notification-icon.png — monochrome putih transparan untuk Android status bar.
    
    Aturan Android notification icon:
    - Hanya alpha channel yang digunakan (warna diabaikan)
    - Semua piksel berwarna → putih
    - Background → transparan
    - Ukuran: 96x96 (xxxhdpi) dengan konten di area 72x72
    """
    img = open_source().convert("RGBA")
    
    # Ukuran final
    final_size = 96
    # Area konten aman (Android safe area ~75% dari total)
    content_size = 72
    
    # Resize gambar ke content_size
    img_resized = img.resize((content_size, content_size), Image.LANCZOS)
    r, g, b, a = img_resized.split()
    
    # Strategi monochrome:
    # 1. Konversi ke grayscale untuk menentukan tepi/kontur
    gray = img_resized.convert("L")
    
    # 2. Piksel yang "ada" (alpha > threshold) → putih solid
    # 3. Piksel yang "kosong" (alpha < threshold) → transparan
    
    # Threshold alpha: piksel semi-transparan di tepi logo
    threshold = 30
    
    # Buat mask dari alpha channel (mana yang "ada konten")
    # Untuk area putih di source (background), kita perlu bedakan dari konten
    # Caranya: piksel yang terang (grayscale > 240) DAN alpha besar → background → transparan
    # Piksel yang gelap atau berwarna → konten → putih
    
    img_arr = np.array(img_resized, dtype=np.uint8)
    
    gray_arr = np.array(gray, dtype=np.uint8)
    alpha_arr = img_arr[:, :, 3]
    
    # Mask konten: alpha > threshold DAN (tidak terlalu putih)
    # "Tidak terlalu putih" = grayscale < 235 ATAU alpha < 200 (area transparan source)
    is_opaque = alpha_arr > threshold
    is_background_white = (gray_arr > 235) & (alpha_arr > 200)
    
    # Konten = ada alpha DAN bukan background putih
    is_content = is_opaque & ~is_background_white
    
    # Buat output: channel RGBA semua putih, alpha dari mask konten
    out_arr = np.zeros((content_size, content_size, 4), dtype=np.uint8)
    out_arr[is_content, 0] = 255  # R
    out_arr[is_content, 1] = 255  # G
    out_arr[is_content, 2] = 255  # B
    out_arr[is_content, 3] = 255  # A (solid)
    
    # Piksel semi-transparan di tepi → anti-aliasing putih
    is_edge = is_opaque & is_background_white & (alpha_arr < 200)
    out_arr[is_edge, :3] = 255
    out_arr[is_edge, 3] = alpha_arr[is_edge]
    
    notif_content = Image.fromarray(out_arr, "RGBA")
    
    # Sedikit sharpening agar tetap jelas di ukuran kecil
    notif_content = notif_content.filter(ImageFilter.SHARPEN)
    
    # Tempatkan di canvas final 96x96 (centered)
    canvas = Image.new("RGBA", (final_size, final_size), (0, 0, 0, 0))
    offset = (final_size - content_size) // 2
    canvas.paste(notif_content, (offset, offset), notif_content.split()[3])
    
    out_path = os.path.join(ASSETS_DIR, "notification-icon.png")
    canvas.save(out_path, "PNG", optimize=True)
    print(f"  [OK] notification-icon.png ({final_size}x{final_size}px, monochrome putih transparan) -> {out_path}")

def main():
    print("=" * 60)
    print("  MotorCare Asset Rebrand")
    print("  Sumber: assets/baru.jpeg")
    print("=" * 60)
    print()
    
    if not os.path.exists(SOURCE):
        print(f"ERROR: File sumber tidak ditemukan: {SOURCE}")
        return
    
    print("Menghasilkan aset...")
    
    try:
        make_icon_png()
    except Exception as e:
        print(f"  [ERR] icon.png ERROR: {e}")
    
    try:
        make_adaptive_icon_png()
    except Exception as e:
        print(f"  [ERR] adaptive-icon.png ERROR: {e}")
    
    try:
        make_splash_icon_png()
    except Exception as e:
        print(f"  [ERR] splash-icon.png ERROR: {e}")
    
    try:
        make_favicon_png()
    except Exception as e:
        print(f"  [ERR] favicon.png ERROR: {e}")
    
    try:
        make_brand_preview_png()
    except Exception as e:
        print(f"  [ERR] motorcare-brand-preview.png ERROR: {e}")
    
    try:
        make_notification_icon_png()
    except Exception as e:
        print(f"  [ERR] notification-icon.png ERROR: {e}")
    
    print()
    print("[DONE] Selesai! Semua aset telah di-generate.")
    print("=" * 60)

if __name__ == "__main__":
    main()
