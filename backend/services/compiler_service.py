from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
import io
from typing import List, Dict

def compile_paper(exam_title: str, subject: str, duration: str,
                  total_marks: int, exam_date: str,
                  questions: List[Dict]) -> bytes:
    """
    Generate a professional exam paper PDF from a list of questions.
    
    Args:
        exam_title: e.g., 'Annual Examination 2026'
        subject: e.g., 'Computer Science'
        duration: e.g., '3 Hours'
        total_marks: e.g., 100
        exam_date: e.g., '2026-10-15'
        questions: List of dicts with keys:
            - 'question_text': str
            - 'marks': int
            - 'question_type': 'MCQ' | 'SHORT' | 'LONG'
            - 'options': list[str] (for MCQ only)
    
    Returns:
        PDF bytes of the compiled question paper.
    """
    packet = io.BytesIO()
    doc = SimpleDocTemplate(packet, pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name='TitleStyle',
        parent=styles['Heading1'],
        alignment=1, # Center
        fontSize=18,
        spaceAfter=6
    )
    subject_style = ParagraphStyle(
        name='SubjectStyle',
        parent=styles['Heading2'],
        alignment=1,
        fontSize=14,
        spaceAfter=12
    )
    header_style = ParagraphStyle(
        name='HeaderStyle',
        parent=styles['Normal'],
        fontSize=11
    )
    question_style = ParagraphStyle(
        name='QuestionStyle',
        parent=styles['Normal'],
        fontSize=11,
        spaceBefore=6,
        spaceAfter=6
    )
    option_style = ParagraphStyle(
        name='OptionStyle',
        parent=styles['Normal'],
        fontSize=11,
        leftIndent=20,
        spaceAfter=2
    )
    
    story = []
    
    # Header
    story.append(Paragraph(exam_title, title_style))
    story.append(Paragraph(subject, subject_style))
    
    # Details table
    data = [
        [Paragraph(f"<b>Date:</b> {exam_date}", header_style),
         Paragraph(f"<b>Duration:</b> {duration}", header_style),
         Paragraph(f"<b>Total Marks:</b> {total_marks}", header_style)]
    ]
    t = Table(data, colWidths=[5.5*cm, 5.5*cm, 5.5*cm])
    t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('LINEBELOW', (0,0), (-1,-1), 1, colors.black),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(t)
    story.append(Spacer(1, 0.5*inch))
    
    # Instructions
    story.append(Paragraph("<b>Instructions to Candidates:</b>", styles['Heading3']))
    story.append(Paragraph("1. All questions are compulsory.", styles['Normal']))
    story.append(Paragraph("2. Read questions carefully before answering.", styles['Normal']))
    story.append(Spacer(1, 0.5*inch))
    
    # Questions
    q_num = 1
    for q in questions:
        q_text = f"<b>Q{q_num}.</b> {q['question_text']} <i>[{q['marks']} marks]</i>"
        story.append(Paragraph(q_text, question_style))
        
        if q.get('question_type') == 'MCQ' and 'options' in q:
            for opt_idx, opt_text in enumerate(q['options']):
                letter = chr(65 + opt_idx) # A, B, C, D...
                story.append(Paragraph(f"{letter}) {opt_text}", option_style))
                
        if q.get('question_type') == 'SHORT':
            story.append(Spacer(1, 1*inch))
            
        if q.get('question_type') == 'LONG':
            story.append(Spacer(1, 2*inch))
            
        q_num += 1
        story.append(Spacer(1, 12))
        
    doc.build(story)
    packet.seek(0)
    return packet.getvalue()
