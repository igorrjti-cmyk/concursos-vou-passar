#!/usr/bin/env python3
"""Extrai PDFs em texto UTF-8, preservando marcadores de página; usa OCR quando necessário."""
from pathlib import Path
import json
import os
import re
import subprocess
import sys

ROOT = Path("materiais-trt4").resolve()
OUT = Path("saida-pdf")
folder = os.environ.get("PASTA_MATERIA", "direito-do-trabalho").strip().strip("/")
if not re.fullmatch(r"[a-zA-Z0-9_/-]+", folder) or ".." in Path(folder).parts:
    raise SystemExit("Nome de pasta inválido.")
source = (ROOT / folder).resolve()
if ROOT not in source.parents or not source.exists():
    raise SystemExit(f"Pasta não encontrada dentro de materiais-trt4: {folder}")

pdfs = sorted(source.rglob("*.pdf"))
if not pdfs:
    raise SystemExit(f"Nenhum PDF encontrado em {source}")

manifest = []
for pdf in pdfs:
    rel = pdf.relative_to(ROOT)
    dest = OUT / rel.with_suffix(".txt")
    dest.parent.mkdir(parents=True, exist_ok=True)
    info = subprocess.run(["pdfinfo", str(pdf)], capture_output=True, text=True, check=True).stdout
    match = re.search(r"^Pages:\s+(\d+)", info, re.M)
    if not match:
        raise RuntimeError(f"Não foi possível obter o número de páginas: {pdf}")
    pages = int(match.group(1))
    chunks = []
    ocr_pages = []
    for page in range(1, pages + 1):
        extracted = subprocess.run(
            ["pdftotext", "-f", str(page), "-l", str(page), "-layout", "-enc", "UTF-8", str(pdf), "-"],
            capture_output=True, text=True, check=True
        ).stdout.strip()
        # OCR apenas quando a camada textual está ausente ou praticamente vazia.
        if len(re.sub(r"\s+", "", extracted)) < 35:
            image = subprocess.run(
                ["pdftoppm", "-f", str(page), "-l", str(page), "-r", "200", "-png", "-singlefile", str(pdf), "/tmp/pdf_page"],
                capture_output=True
            )
            if image.returncode == 0 and Path("/tmp/pdf_page.png").exists():
                ocr = subprocess.run(
                    ["tesseract", "/tmp/pdf_page.png", "stdout", "-l", "por", "--psm", "3"],
                    capture_output=True, text=True
                )
                if ocr.returncode == 0 and ocr.stdout.strip():
                    extracted = ocr.stdout.strip()
                    ocr_pages.append(page)
                Path("/tmp/pdf_page.png").unlink(missing_ok=True)
        chunks.append(f"\n\n========== PÁGINA {page} ==========\n\n{extracted or '[SEM TEXTO EXTRAÍDO; conferir imagem original]'}")
    dest.write_text(f"ARQUIVO: {pdf.name}\nPÁGINAS: {pages}\nFONTE: {rel.as_posix()}\n" + "".join(chunks), encoding="utf-8")
    manifest.append({
        "arquivo": rel.as_posix(),
        "texto_extraido": dest.relative_to(OUT).as_posix(),
        "paginas": pages,
        "paginas_com_ocr": ocr_pages,
        "bytes_pdf": pdf.stat().st_size
    })
    print(f"OK: {rel} ({pages} páginas; OCR em {len(ocr_pages)} páginas)")

OUT.mkdir(exist_ok=True)
(OUT / "manifesto.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Concluído: {len(manifest)} PDFs.")
