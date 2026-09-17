from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import Color
from pypdf import PdfReader, PdfWriter
import io

def create_watermark_overlay(centre_code: str, distribution_id: str, 
                              timestamp: str, ip_address: str) -> bytes:
    """
    Create a PDF page with watermark text overlay.
    Uses reportlab to create a transparent overlay with:
    - Diagonal semi-transparent text: 'CONFIDENTIAL - CENTRE: {code}'
    - Bottom text: 'DIST-ID: {id} | TIME: {timestamp} | IP: {ip}'
    Returns PDF bytes of the overlay page.
    """
    packet = io.BytesIO()
    can = canvas.Canvas(packet, pagesize=A4)
    
    # Semi-transparent color
    transparent_gray = Color(0.5, 0.5, 0.5, alpha=0.3)
    can.setFillColor(transparent_gray)
    
    # Diagonal watermark
    can.saveState()
    can.translate(A4[0] / 2.0, A4[1] / 2.0)
    can.rotate(45)
    can.setFont("Helvetica-Bold", 40)
    can.drawCentredString(0, 0, f"CONFIDENTIAL - CENTRE: {centre_code}")
    can.restoreState()
    
    # Bottom text
    can.setFillColor(Color(0, 0, 0, alpha=0.5))
    can.setFont("Helvetica", 10)
    bottom_text = f"DIST-ID: {distribution_id} | TIME: {timestamp} | IP: {ip_address}"
    can.drawString(20, 20, bottom_text)
    
    can.save()
    packet.seek(0)
    return packet.getvalue()

def apply_watermark(original_pdf: bytes, centre_code: str, 
                    distribution_id: str, timestamp: str, 
                    ip_address: str) -> bytes:
    """
    Apply watermark to every page of the original PDF.
    Returns watermarked PDF bytes.
    """
    watermark_pdf = create_watermark_overlay(centre_code, distribution_id, timestamp, ip_address)
    
    original_reader = PdfReader(io.BytesIO(original_pdf))
    watermark_reader = PdfReader(io.BytesIO(watermark_pdf))
    watermark_page = watermark_reader.pages[0]
    
    writer = PdfWriter()
    
    for page in original_reader.pages:
        page.merge_page(watermark_page)
        writer.add_page(page)
        
    output_packet = io.BytesIO()
    writer.write(output_packet)
    output_packet.seek(0)
    return output_packet.getvalue()

def embed_invisible_watermark(pdf_bytes: bytes, centre_id: str) -> bytes:
    """
    Embed invisible metadata watermark in PDF.
    Adds custom XMP metadata with centre_id and hash.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()
    
    for page in reader.pages:
        writer.add_page(page)
        
    metadata = reader.metadata
    new_metadata = dict(metadata) if metadata else {}
    new_metadata.update({
        "/CustomCentreID": centre_id,
        "/Watermark": "SecureQPSystem"
    })
    
    writer.add_metadata(new_metadata)
    
    output_packet = io.BytesIO()
    writer.write(output_packet)
    output_packet.seek(0)
    return output_packet.getvalue()
