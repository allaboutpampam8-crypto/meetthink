"""
MeetThink Motion Graphic Video Generator
=========================================
Generates a professional 1080p MP4 motion graphic video introducing
the MeetThink Smart Meeting Management System.

Uses Pillow for frame rendering and pipes raw frames to ffmpeg for encoding.

Content sourced from MeetThink_Presentation.pptx (11 slides).
"""

import subprocess
import math
import os
import sys
from PIL import Image, ImageDraw, ImageFont

# ─── Video Settings ──────────────────────────────────────────────
WIDTH, HEIGHT = 1920, 1080
FPS = 30
OUTPUT_FILE = "MeetThink_MotionGraphic.mp4"

# ─── Color Palette (matching PPT) ───────────────────────────────
C_BG_DARK    = (15, 23, 42)       # #0F172A  Deep Navy
C_BG_LIGHT   = (248, 250, 252)    # #F8FAFC  Soft White
C_WHITE      = (255, 255, 255)
C_PRIMARY    = (29, 78, 216)      # #1D4ED8  Royal Blue
C_PRIMARY_L  = (239, 246, 255)    # #EFF6FF  Blue 50
C_ORANGE     = (249, 115, 22)     # #F97316  Orange
C_ORANGE_D   = (234, 88, 12)      # #EA580C
C_GREEN      = (21, 128, 61)      # #15803D
C_GREEN_D    = (6, 95, 70)        # #065F46
C_PURPLE     = (124, 58, 237)     # #7C3AED
C_RED        = (220, 38, 38)      # #DC2626
C_YELLOW_D   = (217, 119, 6)      # #D97706
C_INDIGO     = (79, 70, 229)      # #4F46E5
C_DARK       = (15, 23, 42)       # #0F172A
C_NAVY       = (30, 41, 59)       # #1E293B
C_SLATE_500  = (100, 116, 139)    # #64748B
C_SLATE_600  = (71, 85, 105)      # #475569
C_BORDER     = (226, 232, 240)    # #E2E8F0
C_SKY        = (56, 189, 248)     # #38BDF8
C_BLUE_400   = (96, 165, 250)     # #60A5FA
C_SLATE_400  = (148, 163, 184)    # #94A3B8
C_DEEP_BLUE  = (30, 58, 138)      # #1E3A8A
C_INDIGO_900 = (49, 46, 129)      # #312E81

# ─── Fonts ───────────────────────────────────────────────────────
FONT_DIR = "C:/Windows/Fonts"

def load_font(name, size):
    """Load a font with fallback."""
    paths = [
        os.path.join(FONT_DIR, name),
        os.path.join(FONT_DIR, "arial.ttf"),
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except (OSError, IOError):
            continue
    return ImageFont.load_default()

FONT_TITLE_72  = load_font("segoeuib.ttf", 72)
FONT_TITLE_52  = load_font("segoeuib.ttf", 52)
FONT_TITLE_42  = load_font("segoeuib.ttf", 42)
FONT_TITLE_36  = load_font("segoeuib.ttf", 36)
FONT_TITLE_30  = load_font("segoeuib.ttf", 30)
FONT_TITLE_28  = load_font("segoeuib.ttf", 28)
FONT_TITLE_24  = load_font("segoeuib.ttf", 24)
FONT_TITLE_22  = load_font("segoeuib.ttf", 22)
FONT_TITLE_20  = load_font("segoeuib.ttf", 20)
FONT_TITLE_18  = load_font("segoeuib.ttf", 18)
FONT_TITLE_16  = load_font("segoeuib.ttf", 16)
FONT_BODY_20   = load_font("segoeui.ttf", 20)
FONT_BODY_18   = load_font("segoeui.ttf", 18)
FONT_BODY_16   = load_font("segoeui.ttf", 16)
FONT_BODY_14   = load_font("segoeui.ttf", 14)
FONT_LIGHT_18  = load_font("segoeuil.ttf", 18)
FONT_LIGHT_16  = load_font("segoeuil.ttf", 16)

# ─── Easing Functions ────────────────────────────────────────────
def ease_out_cubic(t):
    return 1 - (1 - t) ** 3

def ease_out_quad(t):
    return 1 - (1 - t) ** 2

def ease_in_out_cubic(t):
    if t < 0.5:
        return 4 * t * t * t
    return 1 - (-2 * t + 2) ** 3 / 2

def ease_out_back(t):
    c1 = 1.70158
    c3 = c1 + 1
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2

def lerp(a, b, t):
    return a + (b - a) * t

def lerp_color(c1, c2, t):
    return tuple(int(lerp(a, b, t)) for a, b in zip(c1, c2))

def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))

# ─── Drawing Helpers ─────────────────────────────────────────────
def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    r = min(radius, (x1 - x0) / 2, (y1 - y0) / 2)
    if fill:
        draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)
    elif outline:
        draw.rounded_rectangle(xy, radius=r, outline=outline, width=width)

def draw_gradient_rect(img, xy, color_top, color_bottom):
    """Draw a vertical gradient rectangle."""
    x0, y0, x1, y1 = [int(v) for v in xy]
    draw = ImageDraw.Draw(img)
    h = y1 - y0
    if h <= 0:
        return
    for i in range(h):
        t = i / max(h - 1, 1)
        c = lerp_color(color_top, color_bottom, t)
        draw.line([(x0, y0 + i), (x1, y0 + i)], fill=c)

def draw_text_centered(draw, text, cx, cy, font, fill=C_WHITE):
    """Draw text centered at (cx, cy)."""
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw / 2, cy - th / 2), text, font=font, fill=fill)

def draw_text_wrapped(draw, text, x, y, max_width, font, fill, line_spacing=6):
    """Draw text with word wrapping, return total height used."""
    words = text.split()
    lines = []
    current_line = ""
    for word in words:
        test_line = f"{current_line} {word}".strip() if current_line else word
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)
    
    total_h = 0
    for line in lines:
        draw.text((x, y + total_h), line, font=font, fill=fill)
        bbox = draw.textbbox((0, 0), line, font=font)
        total_h += (bbox[3] - bbox[1]) + line_spacing
    return total_h

def draw_progress_bar(draw, progress, y=HEIGHT - 6):
    """Draw thin progress bar at the bottom."""
    w = int(WIDTH * progress)
    draw.rectangle([0, y, w, y + 6], fill=C_ORANGE)
    draw.rectangle([w, y, WIDTH, y + 6], fill=(30, 41, 59))

def draw_footer(draw, progress):
    """Draw footer bar with logo and progress."""
    draw.rectangle([0, HEIGHT - 50, WIDTH, HEIGHT], fill=(10, 18, 36))
    # Logo text
    draw.text((30, HEIGHT - 42), "Meet", font=FONT_TITLE_18, fill=C_WHITE)
    bbox = draw.textbbox((30, HEIGHT - 42), "Meet", font=FONT_TITLE_18)
    draw.text((bbox[2], HEIGHT - 42), "Think", font=FONT_TITLE_18, fill=C_ORANGE)
    # URL
    draw.text((WIDTH - 330, HEIGHT - 38), "meetthink.vercel.app", font=FONT_BODY_16, fill=C_SLATE_400)
    # Progress bar
    bar_x = 200
    bar_w = WIDTH - 550
    bar_y = HEIGHT - 32
    draw.rounded_rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + 4], radius=2, fill=(30, 41, 59))
    if progress > 0:
        pw = int(bar_w * progress)
        draw.rounded_rectangle([bar_x, bar_y, bar_x + pw, bar_y + 4], radius=2, fill=C_ORANGE)

# ─── Scene Definitions ───────────────────────────────────────────
# Each scene: (duration_seconds, render_function)

def scene_intro(img, draw, t, frame):
    """Scene 1: Opening / Cover (0-6s)"""
    # Dark background with gradient
    draw_gradient_rect(img, (0, 0, WIDTH, HEIGHT), (8, 12, 28), (20, 30, 55))
    
    # Animated accent line at top
    line_w = int(WIDTH * ease_out_cubic(clamp(t / 1.0)))
    draw.rectangle([0, 0, line_w, 8], fill=C_ORANGE)
    
    # Floating geometric shapes (decorative)
    for i in range(5):
        angle = t * 0.3 + i * 1.2
        cx = WIDTH * 0.7 + math.sin(angle) * 150 + i * 60
        cy = 200 + math.cos(angle * 0.7) * 100 + i * 80
        size = 30 + i * 15
        alpha_t = clamp((t - 0.5 - i * 0.2) / 0.8)
        if alpha_t > 0:
            opacity = int(30 + 20 * math.sin(t + i))
            color = (29, 78, 216, opacity) if i % 2 == 0 else (249, 115, 22, opacity)
            # Simple circles for decoration
            r = int(size * ease_out_back(clamp(alpha_t)))
            draw.ellipse([int(cx-r), int(cy-r), int(cx+r), int(cy+r)], 
                        fill=(*color[:3], max(10, opacity)))
    
    # "ENTERPRISE SOLUTION" pill
    pill_t = clamp((t - 0.5) / 0.6)
    if pill_t > 0:
        pill_alpha = ease_out_cubic(pill_t)
        pill_y = int(lerp(250, 200, pill_alpha))
        draw_rounded_rect(draw, (120, pill_y, 380, pill_y + 40), 8, fill=C_NAVY, outline=(51, 65, 85))
        draw.text((140, pill_y + 8), "ENTERPRISE SOLUTION", font=FONT_TITLE_16, fill=C_ORANGE)
    
    # Main title "MeetThink"
    title_t = clamp((t - 1.0) / 0.8)
    if title_t > 0:
        a = ease_out_back(title_t)
        title_y = int(lerp(320, 260, a))
        draw.text((120, title_y), "Meet", font=FONT_TITLE_72, fill=C_WHITE)
        bbox = draw.textbbox((120, title_y), "Meet", font=FONT_TITLE_72)
        draw.text((bbox[2] + 5, title_y), "Think", font=FONT_TITLE_72, fill=C_ORANGE)
    
    # Subtitle
    sub_t = clamp((t - 1.8) / 0.6)
    if sub_t > 0:
        a = ease_out_cubic(sub_t)
        sub_y = int(lerp(400, 360, a))
        draw.text((120, sub_y), "Smart Meeting Management & Collaboration System", 
                  font=FONT_TITLE_28, fill=C_SKY)
    
    # Description
    desc_t = clamp((t - 2.5) / 0.8)
    if desc_t > 0:
        a = ease_out_cubic(desc_t)
        desc_y = int(lerp(470, 430, a))
        desc = "Solusi komprehensif transformasi manajemen rapat perusahaan:"
        draw.text((120, desc_y), desc, font=FONT_BODY_20, fill=C_SLATE_400)
        desc2 = "Pemesanan Ruangan, Multi-Level Approval, Absensi QR Code, & Action Items"
        draw.text((120, desc_y + 32), desc2, font=FONT_BODY_18, fill=C_SLATE_400)
    
    # Info boxes
    box_t = clamp((t - 3.5) / 0.8)
    if box_t > 0:
        a = ease_out_cubic(box_t)
        box_y = int(lerp(600, 550, a))
        
        # Box 1: Live URL
        draw_rounded_rect(draw, (120, box_y, 560, box_y + 110), 12, fill=C_NAVY, outline=(51, 65, 85))
        draw.text((150, box_y + 15), "LIVE PRODUCTION", font=FONT_TITLE_16, fill=C_SLATE_400)
        draw.text((150, box_y + 50), "meetthink.vercel.app", font=FONT_TITLE_22, fill=C_BLUE_400)
        
        # Box 2: Tech
        draw_rounded_rect(draw, (590, box_y, 1030, box_y + 110), 12, fill=C_NAVY, outline=(51, 65, 85))
        draw.text((620, box_y + 15), "ARSITEKTUR MODERN", font=FONT_TITLE_16, fill=C_SLATE_400)
        draw.text((620, box_y + 50), "Next.js 15 • PostgreSQL • NextAuth", font=FONT_TITLE_20, fill=C_WHITE)


def scene_problems(img, draw, t, frame):
    """Scene 2: Problems (6-14s)"""
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=C_BG_LIGHT)
    
    # Header
    header_t = clamp(t / 0.6)
    if header_t > 0:
        a = ease_out_cubic(header_t)
        # Category pill
        draw_rounded_rect(draw, (100, int(lerp(80, 50, a)), 420, int(lerp(110, 80, a))), 6, 
                         fill=(255, 247, 237), outline=(253, 186, 116))
        draw.text((120, int(lerp(84, 54, a))), "LATAR BELAKANG & MASALAH", font=FONT_TITLE_16, fill=C_ORANGE_D)
        
        draw.text((100, int(lerp(140, 100, a))), 
                  "Tantangan Klasik Manajemen Rapat", font=FONT_TITLE_36, fill=C_DARK)
        # Divider
        draw.rectangle([100, int(lerp(200, 155, a)), 1200, int(lerp(202, 157, a))], fill=C_BORDER)
    
    problems = [
        ("01", "Jadwal Bentrok & Ruangan Ganda", 
         "Pemesanan ruangan melalui WhatsApp atau catatan manual sering tumpang tindih.", C_RED, (254, 242, 242)),
        ("02", "Birokrasi Persetujuan Berbelit",
         "Proses perizinan peminjaman ruangan lambat, hilang jejak, dan membingungkan.", C_ORANGE_D, (255, 247, 237)),
        ("03", "Absensi Kertas Tidak Akurat",
         "Daftar hadir fisik rawan tercecer, sulit direkapitulasi, rentan titip absen.", C_YELLOW_D, (255, 251, 235)),
        ("04", "Komitmen Notulensi Terlupakan",
         "Keputusan rapat dan action items menguap tanpa pengawasan dan deadline.", C_INDIGO, (238, 242, 255)),
    ]
    
    for i, (num, title, desc, color, bg) in enumerate(problems):
        card_t = clamp((t - 0.8 - i * 0.5) / 0.7)
        if card_t <= 0:
            continue
        
        a = ease_out_cubic(card_t)
        col = i % 2
        row = i // 2
        cx = 100 + col * 880
        cy = int(lerp(250 + row * 230, 190 + row * 220, a))
        cw = 840
        ch = 200
        
        # Card
        draw_rounded_rect(draw, (cx, cy, cx + cw, cy + ch), 12, fill=C_WHITE, outline=C_BORDER, width=2)
        # Left accent
        draw.rectangle([cx, cy + 4, cx + 8, cy + ch - 4], fill=color)
        
        # Number badge
        draw_rounded_rect(draw, (cx + 30, cy + 25, cx + 90, cy + 70), 8, fill=bg)
        draw_text_centered(draw, num, cx + 60, cy + 47, FONT_TITLE_22, fill=color)
        
        # Title & desc
        draw.text((cx + 110, cy + 30), title, font=FONT_TITLE_22, fill=C_DARK)
        draw_text_wrapped(draw, desc, cx + 110, cy + 70, cw - 150, FONT_BODY_18, C_SLATE_600)


def scene_solution_pillars(img, draw, t, frame):
    """Scene 3: Solution Pillars (14-22s)"""
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=C_BG_LIGHT)
    
    # Header
    header_t = clamp(t / 0.5)
    a = ease_out_cubic(header_t)
    draw_rounded_rect(draw, (100, int(lerp(80, 50, a)), 380, int(lerp(110, 80, a))), 6,
                     fill=(255, 247, 237), outline=(253, 186, 116))
    draw.text((115, int(lerp(84, 54, a))), "SOLUSI KOMPREHENSIF", font=FONT_TITLE_16, fill=C_ORANGE_D)
    draw.text((100, int(lerp(140, 100, a))),
              "MeetThink: Solusi Terpadu Manajemen Rapat", font=FONT_TITLE_36, fill=C_DARK)
    draw.rectangle([100, int(lerp(200, 155, a)), 1400, int(lerp(202, 157, a))], fill=C_BORDER)
    
    pillars = [
        ("01", "PEMESANAN CERDAS", "Smart Booking &\nAvailability",
         "Deteksi bentrok ruangan otomatis dan peringatan jadwal peserta.", C_PRIMARY),
        ("02", "PERSETUJUAN BERJENJANG", "Multi-Level\nApproval",
         "Alur persetujuan fleksibel dengan catatan audit lengkap.", C_ORANGE_D),
        ("03", "ABSENSI MANDIRI", "QR Code\nAttendance",
         "Presensi digital nirsentuh dengan validasi waktu cerdas.", C_GREEN),
        ("04", "TINDAK LANJUT TUGAS", "Action Item\nTracking",
         "Notulensi terkunci, delegasi tugas ke PIC, notifikasi email.", C_PURPLE),
    ]
    
    for i, (num, tag, title, desc, color) in enumerate(pillars):
        card_t = clamp((t - 0.8 - i * 0.5) / 0.8)
        if card_t <= 0:
            continue
        
        a = ease_out_back(card_t)
        cx = 100 + i * 440
        cy = int(lerp(250, 185, a))
        cw = 410
        ch = 520
        
        # Card
        draw_rounded_rect(draw, (cx, cy, cx + cw, cy + ch), 12, fill=C_WHITE, outline=C_BORDER, width=2)
        # Top accent bar
        draw.rectangle([cx, cy, cx + cw, cy + 8], fill=color)
        
        # Number
        draw.text((cx + 30, cy + 30), num, font=FONT_TITLE_42, fill=color)
        
        # Tag
        draw.text((cx + 30, cy + 95), tag, font=FONT_TITLE_16, fill=C_SLATE_500)
        
        # Title
        title_y = cy + 130
        for line in title.split('\n'):
            draw.text((cx + 30, title_y), line, font=FONT_TITLE_24, fill=C_DARK)
            title_y += 32
        
        # Divider
        draw.rectangle([cx + 30, title_y + 10, cx + cw - 30, title_y + 12], fill=C_BORDER)
        
        # Description
        draw_text_wrapped(draw, desc, cx + 30, title_y + 25, cw - 60, FONT_BODY_18, C_SLATE_600)


def scene_smart_booking(img, draw, t, frame):
    """Scene 4: Smart Booking Detail (22-30s)"""
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=C_BG_LIGHT)
    
    # Header
    header_t = clamp(t / 0.5)
    a = ease_out_cubic(header_t)
    draw_rounded_rect(draw, (100, int(lerp(80, 50, a)), 360, int(lerp(110, 80, a))), 6,
                     fill=(255, 247, 237), outline=(253, 186, 116))
    draw.text((120, int(lerp(84, 54, a))), "PILAR OPERASIONAL", font=FONT_TITLE_16, fill=C_ORANGE_D)
    draw.text((100, int(lerp(140, 100, a))),
              "Pemesanan Ruangan & Proteksi Bentrok Ganda", font=FONT_TITLE_36, fill=C_DARK)
    draw.rectangle([100, int(lerp(200, 155, a)), 1500, int(lerp(202, 157, a))], fill=C_BORDER)
    
    # Left: Feature list
    features = [
        ("Pencegahan Bentrok Ruangan", "Sistem mengevaluasi interval waktu secara otomatis."),
        ("Peringatan Jadwal Pegawai", "Peringatan visual jika peserta punya agenda bentrok."),
        ("Katalog Ruangan Komprehensif", "Kapasitas, denah, foto, dan fasilitas lengkap."),
        ("Integrasi Fasilitas & Konsumsi", "Request dalam satu formulir dengan timeline harian."),
    ]
    
    # Main left card
    left_t = clamp((t - 0.5) / 0.6)
    if left_t > 0:
        la = ease_out_cubic(left_t)
        lx = int(lerp(50, 100, la))
        draw_rounded_rect(draw, (lx, 180, lx + 1060, 730), 12, fill=C_WHITE, outline=C_BORDER, width=2)
    
    for i, (title, desc) in enumerate(features):
        feat_t = clamp((t - 1.0 - i * 0.5) / 0.6)
        if feat_t <= 0:
            continue
        fa = ease_out_cubic(feat_t)
        fy = int(lerp(240 + i * 130, 210 + i * 125, fa))
        
        # Bullet
        draw.ellipse([130, fy + 5, 148, fy + 23], fill=C_PRIMARY)
        draw.text((165, fy), title, font=FONT_TITLE_20, fill=C_DARK)
        draw.text((165, fy + 30), desc, font=FONT_BODY_16, fill=C_SLATE_600)
    
    # Right callout card
    right_t = clamp((t - 2.0) / 0.8)
    if right_t > 0:
        ra = ease_out_back(right_t)
        rx = int(lerp(1300, 1200, ra))
        ry = 180
        rw = 620
        rh = 550
        
        draw_rounded_rect(draw, (rx, ry, rx + rw, ry + rh), 12, fill=C_DEEP_BLUE)
        
        draw.text((rx + 40, ry + 40), "PROTEKSI BENTROK GANDA", font=FONT_TITLE_16, fill=(253, 186, 116))
        draw.text((rx + 40, ry + 80), "Ruangan &", font=FONT_TITLE_30, fill=C_WHITE)
        draw.text((rx + 40, ry + 118), "Pegawai Aman", font=FONT_TITLE_30, fill=C_WHITE)
        
        draw_text_wrapped(draw, 
            "Sistem tidak hanya mencegah tumpang tindih ruangan, tetapi juga melindungi jadwal pegawai dari penumpukan rapat.",
            rx + 40, ry + 180, rw - 80, FONT_BODY_18, (191, 219, 254))
        
        # Sub box
        draw_rounded_rect(draw, (rx + 40, ry + 350, rx + rw - 40, ry + rh - 30), 8,
                         fill=(23, 37, 84), outline=(59, 130, 246))
        draw.text((rx + 60, ry + 370), "Ketersediaan Real-Time", font=FONT_TITLE_16, fill=(147, 197, 253))
        draw.text((rx + 60, ry + 400), "Sinkronisasi instan ke seluruh pengguna.", font=FONT_BODY_16, fill=C_WHITE)


def scene_approval_flow(img, draw, t, frame):
    """Scene 5: Multi-Level Approval (30-38s)"""
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=C_BG_LIGHT)
    
    # Header
    header_t = clamp(t / 0.5)
    a = ease_out_cubic(header_t)
    draw_rounded_rect(draw, (100, int(lerp(80, 50, a)), 420, int(lerp(110, 80, a))), 6,
                     fill=(255, 247, 237), outline=(253, 186, 116))
    draw.text((115, int(lerp(84, 54, a))), "MANAJEMEN ALUR KERJA", font=FONT_TITLE_16, fill=C_ORANGE_D)
    draw.text((100, int(lerp(140, 100, a))),
              "Alur Persetujuan Berjenjang & Hak Akses", font=FONT_TITLE_36, fill=C_DARK)
    draw.rectangle([100, int(lerp(200, 155, a)), 1500, int(lerp(202, 157, a))], fill=C_BORDER)
    
    steps = [
        ("TAHAP 1", "Pengajuan Jadwal", "Pembuat Rapat", "Memilih ruang, jadwal, peserta, & fasilitas."),
        ("TAHAP 2", "Persetujuan Lv 1", "Kepala Divisi", "Verifikasi urgensi agenda dan izin divisi."),
        ("TAHAP 3", "Persetujuan Lv 2", "Admin Fasilitas", "Alokasi ruangan, alat IT, dan konsumsi."),
        ("TAHAP 4", "Rapat Resmi Terbit", "Sistem Terpadu", "QR code absensi & notifikasi email aktif."),
    ]
    
    for i, (step, act, role, desc) in enumerate(steps):
        card_t = clamp((t - 0.8 - i * 0.6) / 0.7)
        if card_t <= 0:
            continue
        
        a = ease_out_back(card_t)
        cx = 100 + i * 440
        cy = int(lerp(250, 185, a))
        cw = 410
        ch = 310
        
        draw_rounded_rect(draw, (cx, cy, cx + cw, cy + ch), 12, fill=C_WHITE, outline=C_BORDER, width=2)
        
        draw.text((cx + 25, cy + 20), step, font=FONT_TITLE_16, fill=C_ORANGE_D)
        draw.text((cx + 25, cy + 55), act, font=FONT_TITLE_24, fill=C_DARK)
        draw.text((cx + 25, cy + 100), f"Aktor: {role}", font=FONT_TITLE_18, fill=C_PRIMARY)
        draw_text_wrapped(draw, desc, cx + 25, cy + 140, cw - 50, FONT_BODY_16, C_SLATE_600)
        
        # Arrow connector
        if i < 3 and card_t > 0.5:
            arrow_t = clamp((card_t - 0.5) / 0.5)
            arrow_a = ease_out_cubic(arrow_t)
            ax = cx + cw + 5
            ay = cy + ch // 2
            aw = int(25 * arrow_a)
            draw.polygon([(ax, ay - 10), (ax + aw, ay), (ax, ay + 10)], fill=C_ORANGE)
    
    # Bottom info box
    bottom_t = clamp((t - 4.0) / 0.8)
    if bottom_t > 0:
        ba = ease_out_cubic(bottom_t)
        by = int(lerp(580, 530, ba))
        draw_rounded_rect(draw, (100, by, 1820, by + 170), 12, fill=C_WHITE, outline=C_BORDER, width=2)
        draw.text((130, by + 20), "Hak Akses Cerdas & Transparansi Operasional",
                  font=FONT_TITLE_22, fill=C_DARK)
        draw_text_wrapped(draw,
            "Pembuat & Tim Fasilitas memantau detail status. Peserta umum hanya melihat status resmi [Disetujui].",
            130, by + 60, 1650, FONT_BODY_18, C_SLATE_600)


def scene_qr_attendance(img, draw, t, frame):
    """Scene 6: QR Code Attendance (38-46s)"""
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=C_BG_LIGHT)
    
    # Header
    header_t = clamp(t / 0.5)
    a = ease_out_cubic(header_t)
    draw_rounded_rect(draw, (100, int(lerp(80, 50, a)), 380, int(lerp(110, 80, a))), 6,
                     fill=(255, 247, 237), outline=(253, 186, 116))
    draw.text((115, int(lerp(84, 54, a))), "EFISIENSI KEHADIRAN", font=FONT_TITLE_16, fill=C_ORANGE_D)
    draw.text((100, int(lerp(140, 100, a))),
              "Absensi Real-Time & QR Code Mandiri", font=FONT_TITLE_36, fill=C_DARK)
    draw.rectangle([100, int(lerp(200, 155, a)), 1400, int(lerp(202, 157, a))], fill=C_BORDER)
    
    cards = [
        ("CONTACTLESS & CEPAT", "Scan Mandiri via Kamera Smartphone",
         "Peserta cukup memindai QR Code. Kehadiran tercatat instan tanpa antrean tanda tangan."),
        ("INTEGRITAS DATA", "Smart Window Validation (30 Menit)",
         "Sesi check-in dibuka 30 menit sebelum rapat. Mencegah manipulasi absensi."),
        ("FLEKSIBILITAS LAPANGAN", "Opsi Check-In Manual oleh Organizer",
         "Penyelenggara bisa mencatat kehadiran manual untuk tamu atau peserta berkendala teknis."),
    ]
    
    for i, (tag, title, desc) in enumerate(cards):
        card_t = clamp((t - 0.6 - i * 0.5) / 0.7)
        if card_t <= 0:
            continue
        
        a = ease_out_cubic(card_t)
        cx = 100
        cy = int(lerp(240 + i * 160, 185 + i * 155, a))
        cw = 1060
        ch = 140
        
        draw_rounded_rect(draw, (cx, cy, cx + cw, cy + ch), 12, fill=C_WHITE, outline=C_BORDER, width=2)
        draw.text((cx + 30, cy + 15), tag, font=FONT_TITLE_16, fill=C_ORANGE_D)
        draw.text((cx + 30, cy + 45), title, font=FONT_TITLE_20, fill=C_DARK)
        draw_text_wrapped(draw, desc, cx + 30, cy + 80, cw - 60, FONT_BODY_16, C_SLATE_600)
    
    # Right green box
    right_t = clamp((t - 2.5) / 0.8)
    if right_t > 0:
        ra = ease_out_back(right_t)
        rx = int(lerp(1300, 1200, ra))
        ry = 185
        rw = 620
        rh = 520
        
        draw_rounded_rect(draw, (rx, ry, rx + rw, ry + rh), 12, fill=C_GREEN_D)
        
        draw.text((rx + 40, ry + 40), "REKAPITULASI LIVE", font=FONT_TITLE_16, fill=(167, 243, 208))
        draw.text((rx + 40, ry + 80), "100% Real-Time", font=FONT_TITLE_30, fill=C_WHITE)
        draw.text((rx + 40, ry + 118), "Rekap Kehadiran", font=FONT_TITLE_30, fill=C_WHITE)
        
        draw_text_wrapped(draw,
            "Setiap scan terverifikasi langsung. Notulensi menampilkan daftar hadir tepat waktu vs terlambat.",
            rx + 40, ry + 180, rw - 80, FONT_BODY_18, (209, 250, 229))
        
        # Stats box
        draw_rounded_rect(draw, (rx + 40, ry + 340, rx + rw - 40, ry + rh - 30), 8,
                         fill=(6, 78, 59), outline=(52, 211, 153))
        draw.text((rx + 60, ry + 360), "Kategori Kehadiran:", font=FONT_TITLE_16, fill=(167, 243, 208))
        draw.text((rx + 60, ry + 390), "Tepat Waktu / Terlambat", font=FONT_BODY_16, fill=C_WHITE)
        draw.text((rx + 60, ry + 420), "Ekspor Laporan PDF & Excel", font=FONT_TITLE_16, fill=(253, 224, 71))


def scene_action_items(img, draw, t, frame):
    """Scene 7: Notulensi & Action Items (46-54s)"""
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=C_BG_LIGHT)
    
    # Header
    header_t = clamp(t / 0.5)
    a = ease_out_cubic(header_t)
    draw_rounded_rect(draw, (100, int(lerp(80, 50, a)), 390, int(lerp(110, 80, a))), 6,
                     fill=(255, 247, 237), outline=(253, 186, 116))
    draw.text((115, int(lerp(84, 54, a))), "AKUNTABILITAS HASIL", font=FONT_TITLE_16, fill=C_ORANGE_D)
    draw.text((100, int(lerp(140, 100, a))),
              "Notulensi Digital & Pelacakan Tindak Lanjut", font=FONT_TITLE_36, fill=C_DARK)
    draw.rectangle([100, int(lerp(200, 155, a)), 1500, int(lerp(202, 157, a))], fill=C_BORDER)
    
    cards = [
        ("A", "Notulensi Terstruktur & Finalisasi",
         "Pencatatan poin bahasan dan keputusan. Fitur penguncian menjamin integritas data."),
        ("B", "Delegasi Tugas & PIC",
         "Setiap keputusan langsung dihubungkan ke PIC spesifik dengan deadline."),
        ("C", "Notifikasi Email Otomatis",
         "PIC menerima email resmi saat ditunjuk, berisi rincian tugas dan tautan progres."),
        ("D", "Peringatan Overdue Dinamis",
         "Tugas melewati deadline ditandai visual (badge merah) untuk tindakan mitigasi."),
    ]
    
    for i, (num, title, desc) in enumerate(cards):
        card_t = clamp((t - 0.6 - i * 0.5) / 0.7)
        if card_t <= 0:
            continue
        
        a = ease_out_cubic(card_t)
        col = i % 2
        row = i // 2
        cx = 100 + col * 880
        cy = int(lerp(250 + row * 230, 185 + row * 225, a))
        cw = 840
        ch = 200
        
        draw_rounded_rect(draw, (cx, cy, cx + cw, cy + ch), 12, fill=C_WHITE, outline=C_BORDER, width=2)
        
        # Circle badge
        bx, by = cx + 50, cy + 40
        draw.ellipse([bx, by, bx + 50, by + 50], fill=C_PRIMARY_L, outline=(191, 219, 254))
        draw_text_centered(draw, num, bx + 25, by + 25, FONT_TITLE_20, fill=C_PRIMARY)
        
        draw.text((cx + 120, cy + 35), title, font=FONT_TITLE_20, fill=C_DARK)
        draw_text_wrapped(draw, desc, cx + 120, cy + 80, cw - 160, FONT_BODY_18, C_SLATE_600)


def scene_dashboard(img, draw, t, frame):
    """Scene 8: Dashboard & Analytics (54-62s)"""
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=C_BG_LIGHT)
    
    # Header
    header_t = clamp(t / 0.5)
    a = ease_out_cubic(header_t)
    draw_rounded_rect(draw, (100, int(lerp(80, 50, a)), 400, int(lerp(110, 80, a))), 6,
                     fill=(255, 247, 237), outline=(253, 186, 116))
    draw.text((115, int(lerp(84, 54, a))), "VISIBILITAS MANAJEMEN", font=FONT_TITLE_16, fill=C_ORANGE_D)
    draw.text((100, int(lerp(140, 100, a))),
              "Dashboard Eksekutif & Laporan Analitik", font=FONT_TITLE_36, fill=C_DARK)
    draw.rectangle([100, int(lerp(200, 155, a)), 1500, int(lerp(202, 157, a))], fill=C_BORDER)
    
    metrics = [
        ("UTILISASI RUANGAN", "Efisiensi Fasilitas",
         "Ruangan paling sering digunakan, jam puncak, dan efisiensi alokasi.", C_PRIMARY),
        ("DISIPLIN KEHADIRAN", "Rasio Kehadiran Divisi",
         "Tingkat kehadiran per unit kerja dan rasio ketepatan waktu.", C_ORANGE_D),
        ("TINDAK LANJUT", "Penyelesaian Action Items",
         "Persentase tugas tepat waktu vs tertunda untuk eksekusi.", C_GREEN),
    ]
    
    for i, (tag, title, desc, color) in enumerate(metrics):
        card_t = clamp((t - 0.6 - i * 0.5) / 0.7)
        if card_t <= 0:
            continue
        
        a = ease_out_back(card_t)
        cx = 100 + i * 580
        cy = int(lerp(250, 185, a))
        cw = 550
        ch = 280
        
        draw_rounded_rect(draw, (cx, cy, cx + cw, cy + ch), 12, fill=C_WHITE, outline=C_BORDER, width=2)
        
        draw.text((cx + 30, cy + 25), tag, font=FONT_TITLE_16, fill=color)
        draw.text((cx + 30, cy + 60), title, font=FONT_TITLE_24, fill=C_DARK)
        draw_text_wrapped(draw, desc, cx + 30, cy + 110, cw - 60, FONT_BODY_18, C_SLATE_600)
    
    # Bottom banner
    banner_t = clamp((t - 3.5) / 0.8)
    if banner_t > 0:
        ba = ease_out_cubic(banner_t)
        by = int(lerp(580, 510, ba))
        draw_rounded_rect(draw, (100, by, 1820, by + 170), 12, fill=C_INDIGO_900)
        draw.text((140, by + 25), "Pengambilan Keputusan Berbasis Data", font=FONT_TITLE_22, fill=(199, 210, 254))
        draw_text_wrapped(draw,
            "Manajemen mengevaluasi efektivitas pertemuan, mengidentifikasi rapat tidak produktif, dan merencanakan kapasitas ruangan.",
            140, by + 70, 1640, FONT_BODY_18, (224, 231, 255))


def scene_tech_arch(img, draw, t, frame):
    """Scene 9: Technology Architecture (62-70s)"""
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=C_BG_LIGHT)
    
    # Header
    header_t = clamp(t / 0.5)
    a = ease_out_cubic(header_t)
    draw_rounded_rect(draw, (100, int(lerp(80, 50, a)), 360, int(lerp(110, 80, a))), 6,
                     fill=(255, 247, 237), outline=(253, 186, 116))
    draw.text((115, int(lerp(84, 54, a))), "KEUNGGULAN TEKNIS", font=FONT_TITLE_16, fill=C_ORANGE_D)
    draw.text((100, int(lerp(140, 100, a))),
              "Arsitektur Teknologi Modern & Keamanan", font=FONT_TITLE_36, fill=C_DARK)
    draw.rectangle([100, int(lerp(200, 155, a)), 1500, int(lerp(202, 157, a))], fill=C_BORDER)
    
    techs = [
        ("FRONTEND & APP RUNTIME", "Next.js 15 (React 19, App Router)",
         "Server-Side Rendering super cepat dan tampilan responsif."),
        ("DATABASE CLOUD & ORM", "Neon PostgreSQL & Prisma ORM",
         "Penyimpanan aman dengan enkripsi SSL/TLS dan integritas ACID."),
        ("OTENTIKASI & KEAMANAN", "NextAuth.js v5 & RBAC",
         "4 peran hierarki, sandi bcrypt, dan sesi terenkripsi penuh."),
        ("DEPLOYMENT & GLOBAL CDN", "Vercel Edge Network",
         "High availability 99.9%, SSL otomatis, dan DDoS protection."),
    ]
    
    for i, (tag, title, desc) in enumerate(techs):
        card_t = clamp((t - 0.6 - i * 0.4) / 0.7)
        if card_t <= 0:
            continue
        
        a = ease_out_cubic(card_t)
        col = i % 2
        row = i // 2
        cx = 100 + col * 880
        cy = int(lerp(250 + row * 230, 185 + row * 225, a))
        cw = 840
        ch = 200
        
        draw_rounded_rect(draw, (cx, cy, cx + cw, cy + ch), 12, fill=C_WHITE, outline=C_BORDER, width=2)
        
        draw.text((cx + 30, cy + 20), tag, font=FONT_TITLE_16, fill=C_ORANGE_D)
        draw.text((cx + 30, cy + 55), title, font=FONT_TITLE_22, fill=C_DARK)
        draw_text_wrapped(draw, desc, cx + 30, cy + 100, cw - 60, FONT_BODY_18, C_SLATE_600)


def scene_roi(img, draw, t, frame):
    """Scene 10: Business Impact & ROI (70-78s)"""
    draw.rectangle([0, 0, WIDTH, HEIGHT], fill=C_BG_LIGHT)
    
    # Header
    header_t = clamp(t / 0.5)
    a = ease_out_cubic(header_t)
    draw_rounded_rect(draw, (100, int(lerp(80, 50, a)), 400, int(lerp(110, 80, a))), 6,
                     fill=(255, 247, 237), outline=(253, 186, 116))
    draw.text((115, int(lerp(84, 54, a))), "RETURN ON INVESTMENT", font=FONT_TITLE_16, fill=C_ORANGE_D)
    draw.text((100, int(lerp(140, 100, a))),
              "Dampak Bisnis & Nilai Tambah", font=FONT_TITLE_36, fill=C_DARK)
    draw.rectangle([100, int(lerp(200, 155, a)), 1400, int(lerp(202, 157, a))], fill=C_BORDER)
    
    impacts = [
        ("70%", "Efisiensi Waktu Koordinasi",
         "Memangkas waktu approval dari hitungan hari menjadi menit.", C_PRIMARY),
        ("100%", "Bebas Kertas (Paperless)",
         "Mengeliminasi lembar absensi, formulir, dan notulensi cetak.", C_GREEN),
        ("0 Kasus", "Nol Ruangan Bentrok",
         "Menghilangkan miskomunikasi dan optimalisasi fasilitas.", C_ORANGE_D),
        ("Tuntas", "Tindak Lanjut Terukur",
         "Seluruh komitmen rapat terpantau hingga eksekusi akhir.", C_PURPLE),
    ]
    
    for i, (metric, label, desc, color) in enumerate(impacts):
        card_t = clamp((t - 0.8 - i * 0.5) / 0.8)
        if card_t <= 0:
            continue
        
        a = ease_out_back(card_t)
        cx = 100 + i * 440
        cy = int(lerp(250, 185, a))
        cw = 410
        ch = 520
        
        draw_rounded_rect(draw, (cx, cy, cx + cw, cy + ch), 12, fill=C_WHITE, outline=C_BORDER, width=2)
        
        # Big metric number
        draw_text_centered(draw, metric, cx + cw // 2, cy + 100, FONT_TITLE_52, fill=color)
        
        # Label
        draw_text_centered(draw, label, cx + cw // 2, cy + 185, FONT_TITLE_20, fill=C_DARK)
        
        # Divider
        draw.rectangle([cx + 60, cy + 230, cx + cw - 60, cy + 232], fill=C_BORDER)
        
        # Description
        draw_text_wrapped(draw, desc, cx + 40, cy + 260, cw - 80, FONT_BODY_18, C_SLATE_600, line_spacing=8)


def scene_closing(img, draw, t, frame):
    """Scene 11: Closing / Thank You (78-90s)"""
    # Dark background
    draw_gradient_rect(img, (0, 0, WIDTH, HEIGHT), (8, 12, 28), (20, 30, 55))
    
    # "TERIMA KASIH" text
    ty_t = clamp(t / 0.8)
    if ty_t > 0:
        a = ease_out_cubic(ty_t)
        y = int(lerp(200, 150, a))
        draw_text_centered(draw, "TERIMA KASIH", WIDTH // 2, y, FONT_TITLE_22, fill=C_ORANGE)
    
    # Main tagline
    tag_t = clamp((t - 0.8) / 0.8)
    if tag_t > 0:
        a = ease_out_back(tag_t)
        y = int(lerp(280, 230, a))
        text1 = "Mulai Kolaborasi Rapat Lebih Pintar"
        draw_text_centered(draw, text1, WIDTH // 2, y, FONT_TITLE_36, fill=C_WHITE)
        
        y2 = y + 50
        # "Bersama MeetThink"
        part1 = "Bersama "
        part2 = "MeetThink"
        bbox1 = draw.textbbox((0, 0), part1, font=FONT_TITLE_36)
        bbox2 = draw.textbbox((0, 0), part2, font=FONT_TITLE_36)
        w1 = bbox1[2] - bbox1[0]
        w2 = bbox2[2] - bbox2[0]
        total_w = w1 + w2
        start_x = (WIDTH - total_w) // 2
        draw.text((start_x, y2 - 18), part1, font=FONT_TITLE_36, fill=C_WHITE)
        draw.text((start_x + w1, y2 - 18), part2, font=FONT_TITLE_36, fill=C_ORANGE)
    
    # Info box
    box_t = clamp((t - 2.0) / 0.8)
    if box_t > 0:
        a = ease_out_cubic(box_t)
        bx = 350
        by = int(lerp(420, 370, a))
        bw = WIDTH - 700
        bh = 280
        
        draw_rounded_rect(draw, (bx, by, bx + bw, by + bh), 12, fill=C_NAVY, outline=(51, 65, 85), width=2)
        
        draw.text((bx + 40, by + 25), "Tautan & Akun Uji Coba Demo", font=FONT_TITLE_20, fill=C_SKY)
        
        lines = [
            ("Website Live:  ", "meetthink.vercel.app"),
            ("GitHub:  ", "github.com/allaboutpampam8-crypto/meetthink"),
            ("Super Admin:  ", "superadmin@company.com  /  Admin@1234"),
            ("Approver:  ", "kepala@company.com  /  Admin@1234"),
        ]
        
        for j, (label, value) in enumerate(lines):
            line_t = clamp((t - 2.5 - j * 0.3) / 0.5)
            if line_t > 0:
                ly = by + 70 + j * 38
                draw.text((bx + 60, ly), label, font=FONT_TITLE_18, fill=C_WHITE)
                lbbox = draw.textbbox((bx + 60, ly), label, font=FONT_TITLE_18)
                color_val = C_BLUE_400 if j < 2 else C_SLATE_400
                draw.text((lbbox[2], ly), value, font=FONT_BODY_18, fill=color_val)
    
    # Q&A text
    qa_t = clamp((t - 5.0) / 0.8)
    if qa_t > 0:
        a = ease_out_cubic(qa_t)
        y = int(lerp(730, 690, a))
        draw_text_centered(draw, "Sesi Tanya Jawab (Q&A)", WIDTH // 2, y, FONT_TITLE_22, fill=C_SLATE_400)
    
    # Pulsing MeetThink logo at bottom
    if t > 6:
        pulse = 0.8 + 0.2 * math.sin(t * 2)
        logo_size = int(20 * pulse)
        draw_text_centered(draw, "MeetThink", WIDTH // 2, 780, FONT_TITLE_24, fill=C_ORANGE)


# ─── Scene Timeline ──────────────────────────────────────────────
SCENES = [
    (7,  scene_intro,           "Opening"),
    (8,  scene_problems,        "Problems"),
    (8,  scene_solution_pillars, "Solution Pillars"),
    (8,  scene_smart_booking,   "Smart Booking"),
    (8,  scene_approval_flow,   "Approval Flow"),
    (8,  scene_qr_attendance,   "QR Attendance"),
    (8,  scene_action_items,    "Action Items"),
    (8,  scene_dashboard,       "Dashboard"),
    (8,  scene_tech_arch,       "Tech Architecture"),
    (8,  scene_roi,             "Business Impact"),
    (12, scene_closing,          "Closing"),
]

TOTAL_DURATION = sum(d for d, _, _ in SCENES)
TOTAL_FRAMES = TOTAL_DURATION * FPS

# ─── Cross-Fade Transition ───────────────────────────────────────
FADE_FRAMES = int(0.5 * FPS)  # 0.5s cross-fade

def get_scene_for_frame(frame_num):
    """Get scene index and local time for a given frame."""
    elapsed = frame_num / FPS
    cumulative = 0
    for i, (duration, func, name) in enumerate(SCENES):
        if elapsed < cumulative + duration:
            local_t = elapsed - cumulative
            return i, local_t, func
        cumulative += duration
    # Last scene
    i = len(SCENES) - 1
    return i, elapsed - (cumulative - SCENES[i][0]), SCENES[i][1]


def render_frame(frame_num):
    """Render a single frame, with cross-fade between scenes."""
    img = Image.new("RGB", (WIDTH, HEIGHT), C_BG_DARK)
    draw = ImageDraw.Draw(img)
    
    scene_idx, local_t, scene_func = get_scene_for_frame(frame_num)
    
    # Calculate cumulative start frame for current scene
    cumulative = 0
    for i in range(scene_idx):
        cumulative += SCENES[i][0]
    scene_start_frame = int(cumulative * FPS)
    scene_end_frame = int((cumulative + SCENES[scene_idx][0]) * FPS)
    
    # Check if we're in a transition zone
    frames_into_scene = frame_num - scene_start_frame
    frames_until_end = scene_end_frame - frame_num
    
    in_fade_in = frames_into_scene < FADE_FRAMES and scene_idx > 0
    in_fade_out = frames_until_end < FADE_FRAMES and scene_idx < len(SCENES) - 1
    
    if in_fade_out:
        # Render current scene
        img1 = Image.new("RGB", (WIDTH, HEIGHT), C_BG_DARK)
        d1 = ImageDraw.Draw(img1)
        scene_func(img1, d1, local_t, frame_num)
        
        # Render next scene
        next_idx = scene_idx + 1
        next_func = SCENES[next_idx][1]
        img2 = Image.new("RGB", (WIDTH, HEIGHT), C_BG_DARK)
        d2 = ImageDraw.Draw(img2)
        next_func(img2, d2, 0, frame_num)
        
        # Blend
        blend_t = 1 - (frames_until_end / FADE_FRAMES)
        img = Image.blend(img1, img2, blend_t)
    elif in_fade_in:
        # Just render current scene normally (the fade-out of previous scene handles this)
        scene_func(img, draw, local_t, frame_num)
    else:
        scene_func(img, draw, local_t, frame_num)
    
    # Draw footer on top
    draw = ImageDraw.Draw(img)
    progress = frame_num / max(TOTAL_FRAMES - 1, 1)
    draw_footer(draw, progress)
    
    return img


# ─── Main Generator ──────────────────────────────────────────────
def main():
    print("=" * 50)
    print("  MeetThink Motion Graphic Video Generator")
    print("=" * 50)
    print(f"  Resolution: {WIDTH}x{HEIGHT}  FPS: {FPS}")
    print(f"  Duration:   {TOTAL_DURATION}s  Frames: {TOTAL_FRAMES}")
    print(f"  Output:     {OUTPUT_FILE}")
    print("=" * 50)
    print()
    
    # Scene list
    cumulative = 0
    for i, (duration, _, name) in enumerate(SCENES):
        end = cumulative + duration
        print(f"  Scene {i+1:2d}: [{cumulative:3d}s - {end:3d}s] {name}")
        cumulative = end
    print()
    
    # Start ffmpeg process
    ffmpeg_cmd = [
        "ffmpeg",
        "-y",  # Overwrite
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",  # Read from stdin
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "23",
        "-pix_fmt", "yuv420p",
        "-movflags", "+faststart",
        OUTPUT_FILE,
    ]
    
    print(f"Starting ffmpeg: {' '.join(ffmpeg_cmd[:8])}...")
    proc = subprocess.Popen(
        ffmpeg_cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    
    try:
        for frame_num in range(TOTAL_FRAMES):
            img = render_frame(frame_num)
            raw = img.tobytes()
            proc.stdin.write(raw)
            
            # Progress reporting
            if frame_num % FPS == 0 or frame_num == TOTAL_FRAMES - 1:
                pct = (frame_num + 1) / TOTAL_FRAMES * 100
                elapsed_s = frame_num / FPS
                scene_idx, local_t, _ = get_scene_for_frame(frame_num)
                scene_name = SCENES[scene_idx][2]
                bar_len = 30
                filled = int(bar_len * pct / 100)
                bar = "#" * filled + "-" * (bar_len - filled)
                print(f"\r  [{bar}] {pct:5.1f}%  {elapsed_s:.0f}s/{TOTAL_DURATION}s  Scene: {scene_name:<20}", end="", flush=True)
        
        proc.stdin.close()
        stdout, stderr = proc.communicate()
        
        if proc.returncode == 0:
            file_size = os.path.getsize(OUTPUT_FILE)
            size_mb = file_size / (1024 * 1024)
            print(f"\n\n[OK] Video generated successfully!")
            print(f"   File: {os.path.abspath(OUTPUT_FILE)}")
            print(f"   Size: {size_mb:.1f} MB")
            print(f"   Duration: {TOTAL_DURATION}s @ {FPS}fps")
        else:
            print(f"\n\n[ERROR] ffmpeg error (code {proc.returncode}):")
            print(stderr.decode("utf-8", errors="replace")[-500:])
            sys.exit(1)
            
    except Exception as e:
        proc.kill()
        print(f"\n\n[ERROR] Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
