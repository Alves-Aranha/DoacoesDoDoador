#!/usr/bin/env python3
"""
Utilitário para converter o logo PNG para ESC/P binário.
Execute UMA VEZ para gerar o arquivo logo_escp.bin.
Depois basta o agente_impressao.py carregar o PNG diretamente.

Uso:
    python converter_logo.py logo.png --largura 190
"""

import sys, argparse
from PIL import Image


def converter(input_path: str, output_path: str, target_w: int):
    img = Image.open(input_path).convert("L")
    ratio    = target_w / img.width
    target_h = int(img.height * ratio)
    img      = img.resize((target_w, target_h), Image.LANCZOS)
    img1     = img.convert("1", dither=Image.FLOYDSTEINBERG)

    # Salva prévia para conferência visual
    preview = output_path.replace(".bin", "_preview.png")
    img1.save(preview)
    print(f"Prévia salva em: {preview}")

    w, h   = img1.size
    pixels = img1.load()
    rows_8 = (h + 7) // 8
    buf    = bytearray()

    buf += b"\x1b3\x18"

    for row_block in range(rows_8):
        cols = bytearray()
        for col in range(w):
            byte = 0
            for bit in range(8):
                y = row_block * 8 + bit
                if y < h and pixels[col, y] == 0:
                    byte |= (1 << (7 - bit))
            cols.append(byte)
        n1, n2 = w & 0xFF, (w >> 8) & 0xFF
        buf += b"\x1b\x2a\x04" + bytes([n1, n2]) + bytes(cols)
        buf += b"\r\n"

    buf += b"\x1b2"

    with open(output_path, "wb") as f:
        f.write(buf)

    print(f"ESC/P gerado: {output_path}  ({len(buf)} bytes, {w}x{h} pontos)")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("input",  default="logo.png", nargs="?")
    ap.add_argument("--output",  default="logo_escp.bin")
    ap.add_argument("--largura", type=int, default=190)
    args = ap.parse_args()
    converter(args.input, args.output, args.largura)
