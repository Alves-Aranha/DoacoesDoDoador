#!/usr/bin/env python3
"""
Agente de impressão local — Epson FX-890 ESC/P
Recebe requisições HTTP do React e envia dados RAW para a impressora.

Dependências:
    pip install flask pywin32 pillow

Uso:
    python agente_impressao.py
    (manter rodando em background na máquina com a impressora)
"""

import os
from flask import Flask, request, jsonify
from PIL import Image

# ─── Configurações ────────────────────────────────────────────────────────────
LOGO_PATH  = r"logo.png"   # caminho do logo na máquina local
LOGO_WIDTH = 190           # largura em pontos ESC/P
PORT       = 5050
# ─────────────────────────────────────────────────────────────────────────────

app = Flask(__name__)


def image_to_escp(image_path: str, target_w: int = 190) -> bytes:
    """Converte PNG para sequência de bytes ESC/P (modo gráfico Double Density)."""
    img = Image.open(image_path).convert("L")
    ratio    = target_w / img.width
    target_h = int(img.height * ratio)
    img      = img.resize((target_w, target_h), Image.LANCZOS)
    img1     = img.convert("1", dither=Image.FLOYDSTEINBERG)

    w, h   = img1.size
    pixels = img1.load()
    rows_8 = (h + 7) // 8
    buf    = bytearray()

    buf += b"\x1b3\x18"   # espaçamento de linha: 24/216"

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

    buf += b"\x1b2"        # restaura espaçamento padrão 1/6"
    return bytes(buf)


def montar_documento(dados: dict) -> bytes:
    """Monta o documento ESC/P completo com logo + texto."""
    doc = bytearray()

    # Inicializa impressora
    doc += b"\x1b@"        # ESC @ — reset completo

    # Logo
    if dados.get("imprimir_logo", True) and os.path.exists(LOGO_PATH):
        doc += image_to_escp(LOGO_PATH, LOGO_WIDTH)
        doc += b"\n"       # linha em branco após logo

    # Cabeçalho em negrito
    if dados.get("cabecalho"):
        doc += b"\x1bE"    # ESC E — negrito ON
        doc += dados["cabecalho"].encode("latin-1", errors="replace") + b"\r\n"
        doc += b"\x1bF"    # ESC F — negrito OFF

    # Linhas de texto
    for linha in dados.get("linhas", []):
        doc += linha.encode("latin-1", errors="replace") + b"\r\n"

    # Avança formulário
    if dados.get("avancar_pagina", True):
        doc += b"\x0c"     # FF — form feed

    return bytes(doc)


@app.route("/imprimir", methods=["POST"])
def imprimir():
    try:
        import win32print

        dados   = request.get_json(force=True)
        raw     = montar_documento(dados)
        printer = dados.get("impressora") or win32print.GetDefaultPrinter()
        hp      = win32print.OpenPrinter(printer)

        try:
            win32print.StartDocPrinter(hp, 1, ("Relatorio", None, "RAW"))
            win32print.StartPagePrinter(hp)
            win32print.WritePrinter(hp, raw)
            win32print.EndPagePrinter(hp)
            win32print.EndDocPrinter(hp)
        finally:
            win32print.ClosePrinter(hp)

        return jsonify({"status": "ok", "bytes": len(raw)})

    except Exception as e:
        return jsonify({"status": "erro", "mensagem": str(e)}), 500


@app.route("/impressoras", methods=["GET"])
def listar_impressoras():
    try:
        import win32print
        lista = [p[2] for p in win32print.EnumPrinters(
            win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)]
        return jsonify({"impressoras": lista})
    except Exception as e:
        return jsonify({"status": "erro", "mensagem": str(e)}), 500


@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "online"})


if __name__ == "__main__":
    print(f"Agente rodando em http://localhost:{PORT}")
    app.run(host="localhost", port=PORT, debug=False)
