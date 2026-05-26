"""
Fix notification-icon.png
Logika: piksel gelap/berwarna -> putih solid, piksel putih (background) -> transparan
"""

import sys
import os
import numpy as np
from PIL import Image, ImageFilter

sys.stdout.reconfigure(encoding='utf-8')

ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
SOURCE = os.path.join(ASSETS_DIR, "baru.jpeg")

def make_notification_icon():
    """
    Android notification icon rules:
    - White foreground on transparent background (monochrome)
    - Ukuran: 96x96 px (xxxhdpi), konten efektif 72x72
    - Hanya alpha channel yang dipakai Android, RGB diabaikan
    
    Strategi untuk image dengan background PUTIH:
    - Piksel mendekati putih (R>230 & G>230 & B>230) -> TRANSPARAN
    - Piksel berwarna/gelap -> PUTIH SOLID
    - Transisi halus di area abu-abu
    """
    img = Image.open(SOURCE).convert("RGB")
    
    final_size = 96
    content_size = 72
    
    # Resize ke content area
    img_resized = img.resize((content_size, content_size), Image.LANCZOS)
    arr = np.array(img_resized, dtype=np.float32)
    
    R = arr[:, :, 0]
    G = arr[:, :, 1]
    B = arr[:, :, 2]
    
    # "Seberapa putih" piksel ini? (0=hitam, 255=putih murni)
    whiteness = np.minimum(np.minimum(R, G), B)  # min channel
    # Background putih: semua channel tinggi
    # Konten: setidaknya satu channel rendah
    
    # Hitung "colorfulness" - seberapa berwarna/gelap piksel ini
    # Jika whiteness rendah -> piksel gelap -> content
    # Jika whiteness tinggi -> piksel putih -> background
    
    # Alpha: 0 saat whiteness > 230 (background), 255 saat whiteness < 180 (content)
    # Smooth transition di antara 180-230
    
    bg_threshold = 230    # Di atas ini = background putih (transparan)
    content_threshold = 180  # Di bawah ini = konten (putih solid)
    
    alpha = np.zeros((content_size, content_size), dtype=np.float32)
    
    # Area konten jelas: whiteness < content_threshold -> alpha 255
    alpha[whiteness < content_threshold] = 255.0
    
    # Transisi halus (anti-aliasing)
    mid_mask = (whiteness >= content_threshold) & (whiteness < bg_threshold)
    alpha[mid_mask] = (bg_threshold - whiteness[mid_mask]) / (bg_threshold - content_threshold) * 255.0
    
    # Background: alpha = 0 (sudah default)
    
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)
    
    # Build RGBA: semua putih, alpha dari mask
    out = np.zeros((content_size, content_size, 4), dtype=np.uint8)
    out[:, :, 0] = 255  # R
    out[:, :, 1] = 255  # G
    out[:, :, 2] = 255  # B
    out[:, :, 3] = alpha
    
    notif_img = Image.fromarray(out, "RGBA")
    
    # Sharpen agar tetap jelas di ukuran kecil
    notif_img = notif_img.filter(ImageFilter.SHARPEN)
    notif_img = notif_img.filter(ImageFilter.SHARPEN)
    
    # Tempatkan di canvas 96x96, centered
    canvas = Image.new("RGBA", (final_size, final_size), (0, 0, 0, 0))
    offset = (final_size - content_size) // 2
    canvas.paste(notif_img, (offset, offset), notif_img.split()[3])
    
    out_path = os.path.join(ASSETS_DIR, "notification-icon.png")
    canvas.save(out_path, "PNG", optimize=True)
    print(f"[OK] notification-icon.png ({final_size}x{final_size}px) -> {out_path}")
    
    # Juga simpan versi preview 192x192 untuk inspeksi visual di background gelap
    preview_size = 192
    content_preview = notif_img.resize((int(preview_size * 0.75), int(preview_size * 0.75)), Image.LANCZOS)
    preview_canvas = Image.new("RGBA", (preview_size, preview_size), (30, 30, 30, 255))
    po = (preview_size - int(preview_size * 0.75)) // 2
    preview_canvas.paste(content_preview, (po, po), content_preview.split()[3])
    preview_path = os.path.join(ASSETS_DIR, "notification-icon-preview.png")
    preview_canvas.save(preview_path, "PNG")
    print(f"[OK] notification-icon-preview.png (preview di bg gelap) -> {preview_path}")

if __name__ == "__main__":
    make_notification_icon()
    print("[DONE] Notification icon berhasil diperbaiki.")
