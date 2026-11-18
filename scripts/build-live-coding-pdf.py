"""Render the live-coding Markdown guide as a printable A4 PDF.

Requires: pip install reportlab
Run: python scripts/build-live-coding-pdf.py
The PDF is a study aid; it does not replace the student's own recording.
"""

from html import escape
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable, KeepTogether, Paragraph, Preformatted, SimpleDocTemplate, Spacer, Table, TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "PANDUAN_REKAMAN_LENGKAP.md"
OUTPUT = ROOT / "docs" / "PANDUAN_REKAMAN_LIVE_CODING_POST.pdf"
INK = colors.HexColor("#20304A")
BLUE = colors.HexColor("#195A82")
PALE = colors.HexColor("#EEF4F8")
LINE = colors.HexColor("#D7E1E9")


def register_fonts():
    candidates = [
        (Path("C:/Windows/Fonts/arial.ttf"), Path("C:/Windows/Fonts/arialbd.ttf"),
         Path("C:/Windows/Fonts/consola.ttf")),
        (Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
         Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"),
         Path("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf")),
    ]
    for regular, bold, mono in candidates:
        if all(path.exists() for path in (regular, bold, mono)):
            pdfmetrics.registerFont(TTFont("GuideSans", str(regular)))
            pdfmetrics.registerFont(TTFont("GuideSans-Bold", str(bold)))
            pdfmetrics.registerFont(TTFont("GuideMono", str(mono)))
            pdfmetrics.registerFontFamily("GuideSans", normal="GuideSans", bold="GuideSans-Bold")
            return
    raise RuntimeError("Font Arial atau DejaVu Sans tidak ditemukan")


def inline(text):
    """Escape Markdown and render only bold and inline code as PDF markup."""
    tokens = re.split(r"(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)", text)
    rendered = []
    for token in tokens:
        if token.startswith("`") and token.endswith("`"):
            rendered.append(f'<font name="GuideMono" color="#195A82">{escape(token[1:-1])}</font>')
        elif token.startswith("**") and token.endswith("**"):
            rendered.append(f"<b>{inline(token[2:-2])}</b>")
        elif token.startswith("*") and token.endswith("*"):
            rendered.append(escape(token[1:-1]))
        else:
            rendered.append(escape(token))
    return "".join(rendered)


def styles():
    base = getSampleStyleSheet()
    normal = ParagraphStyle("GuideText", parent=base["Normal"], fontName="GuideSans",
                            fontSize=9.5, leading=14.2, textColor=INK, spaceAfter=7,
                            allowWidows=0, allowOrphans=0)
    return {
        "normal": normal,
        "title": ParagraphStyle("GuideTitle", parent=normal, fontName="GuideSans-Bold",
                                fontSize=21, leading=26, textColor=BLUE, spaceAfter=14),
        "h2": ParagraphStyle("GuideH2", parent=normal, fontName="GuideSans-Bold",
                             fontSize=13, leading=17, textColor=BLUE, spaceBefore=14,
                             spaceAfter=7, keepWithNext=True),
        "h3": ParagraphStyle("GuideH3", parent=normal, fontName="GuideSans-Bold",
                             fontSize=10.5, leading=15, textColor=INK, spaceBefore=11,
                             spaceAfter=6, keepWithNext=True),
        "list": ParagraphStyle("GuideList", parent=normal, leftIndent=19,
                               firstLineIndent=-17, spaceAfter=5),
        "quote": ParagraphStyle("GuideQuote", parent=normal, fontSize=9.3,
                                leading=14, spaceAfter=0),
        "cell": ParagraphStyle("GuideCell", parent=normal, fontSize=8.2,
                               leading=11.5, spaceAfter=0),
        "cellhead": ParagraphStyle("GuideCellHead", parent=normal,
                                   fontName="GuideSans-Bold", fontSize=8.2,
                                   leading=11.5, textColor=colors.white, spaceAfter=0),
        "code": ParagraphStyle("GuideCode", parent=normal, fontName="GuideMono",
                               fontSize=8.1, leading=11.5, spaceAfter=0),
    }


def parse_markdown(text, s):
    lines = text.splitlines()
    story = []
    i = 0
    first_title = True
    usable = A4[0] - 92
    while i < len(lines):
        raw = lines[i]
        line = raw.strip()
        if not line:
            i += 1
            continue
        if line.startswith("```"):
            i += 1
            block = []
            while i < len(lines) and not lines[i].strip().startswith("```"):
                block.append(lines[i].replace("\t", "    "))
                i += 1
            code = Preformatted("\n".join(block), s["code"], maxLineLength=105, splitChars=" ,.;")
            box = Table([[code]], colWidths=[usable], hAlign="LEFT")
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("LINEBEFORE", (0, 0), (0, -1), 2, BLUE),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
            ]))
            story.extend([box, Spacer(1, 9)])
            i += 1
            continue
        if line.startswith("| "):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r"[-: ]+", cell) for cell in cells):
                    rows.append(cells)
                i += 1
            columns = len(rows[0])
            widths = [usable / columns] * columns
            if columns == 2:
                widths = [usable * 0.32, usable * 0.68]
            table_data = [
                [Paragraph(inline(cell), s["cellhead"] if row_index == 0 else s["cell"])
                 for cell in row]
                for row_index, row in enumerate(rows)
            ]
            table = Table(table_data, colWidths=widths, repeatRows=1, hAlign="LEFT")
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), BLUE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
                ("GRID", (0, 0), (-1, -1), 0.4, LINE),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]))
            story.extend([table, Spacer(1, 9)])
            continue
        if line.startswith("# "):
            story.append(Paragraph(inline(line[2:]), s["title"] if first_title else s["h2"]))
            if first_title:
                story.extend([HRFlowable(width="100%", thickness=1, color=LINE), Spacer(1, 12)])
            first_title = False
        elif line.startswith("## "):
            story.append(Paragraph(inline(line[3:]), s["h2"]))
        elif line.startswith("### "):
            story.append(Paragraph(inline(line[4:]), s["h3"]))
        elif line.startswith("> "):
            quote = Paragraph(inline(line[2:]), s["quote"])
            box = Table([[quote]], colWidths=[usable], hAlign="LEFT")
            box.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("LINEBEFORE", (0, 0), (0, -1), 2, BLUE),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]))
            story.extend([box, Spacer(1, 9)])
        elif re.match(r"^\d+\. ", line):
            number, content = line.split(". ", 1)
            story.append(Paragraph(f"<b>{number}.</b>  {inline(content)}", s["list"]))
        elif line.startswith("- "):
            story.append(Paragraph(f"•  {inline(line[2:])}", s["list"]))
        else:
            paragraph = [line]
            while i + 1 < len(lines) and lines[i + 1].strip() and not re.match(
                r"^(#|>|\||-|\d+\. |```)", lines[i + 1].strip()
            ):
                i += 1
                paragraph.append(lines[i].strip())
            item = Paragraph(inline(" ".join(paragraph)), s["normal"])
            if line.startswith("**Penjelasan:**") and len(story) >= 4:
                # Keep each layer's heading, code, and its explanation on one page.
                group = story[-4:]
                if isinstance(group[0], Paragraph) and group[0].style is s["h3"]:
                    del story[-4:]
                    story.append(KeepTogether([*group, item]))
                else:
                    story.append(item)
            else:
                story.append(item)
        i += 1
    return story


def page_decoration(canvas, doc):
    canvas.saveState()
    width, height = A4
    canvas.setStrokeColor(LINE)
    canvas.line(46, height - 35, width - 46, height - 35)
    canvas.line(46, 34, width - 46, 34)
    canvas.setFont("GuideSans", 8)
    canvas.setFillColor(BLUE)
    canvas.drawString(46, height - 27, "ETS PWL 2026  /  BOUQUET PRODUCTS REST API")
    canvas.setFillColor(INK)
    canvas.drawString(46, 22, "Muhammad Rifqy Habibi · F1D02410080")
    canvas.drawRightString(width - 46, 22, f"Halaman {doc.page}")
    canvas.restoreState()


def main():
    register_fonts()
    doc = SimpleDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=46, rightMargin=46,
                            topMargin=50, bottomMargin=48,
                            title="Panduan Rekaman Live Coding POST /products — ETS PWL",
                            author="Muhammad Rifqy Habibi")
    doc.build(parse_markdown(SOURCE.read_text(encoding="utf-8"), styles()),
              onFirstPage=page_decoration, onLaterPages=page_decoration)
    print(f"PDF dibuat: {OUTPUT}")


if __name__ == "__main__":
    main()
