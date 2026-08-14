"""
Generate the body PDF for the UML Project document using ReportLab.
Cover is generated separately via Playwright and merged via pypdf.
"""
import os
import sys
import hashlib
import platform
from PIL import Image as PILImage

# ── ReportLab imports ──
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import inch, mm, cm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT, TA_JUSTIFY
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    Image, KeepTogether, CondPageBreak, HRFlowable, Preformatted,
    Flowable, ListFlowable, ListItem
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ── Add skills path for install_font_fallback ──
sys.path.insert(0, "/home/z/my-project/skills/pdf/scripts")
from pdf import install_font_fallback

# ─────────────────────────────────────────────────────────────────────────────
# PALETTE (from palette.cascade)
# ─────────────────────────────────────────────────────────────────────────────
PAGE_BG       = colors.HexColor('#f4f3f2')
SECTION_BG    = colors.HexColor('#f1f1f0')
CARD_BG       = colors.HexColor('#e9e7e2')
TABLE_STRIPE  = colors.HexColor('#f4f3f2')
HEADER_FILL   = colors.HexColor('#71684d')
COVER_BLOCK   = colors.HexColor('#7c704c')
BORDER        = colors.HexColor('#c3bfb4')
ICON          = colors.HexColor('#a38c49')
ACCENT        = colors.HexColor('#9d8333')
ACCENT_2      = colors.HexColor('#735bbc')
TEXT_PRIMARY  = colors.HexColor('#242320')
TEXT_MUTED    = colors.HexColor('#86837c')
SEM_SUCCESS   = colors.HexColor('#458d5d')
SEM_WARNING   = colors.HexColor('#a08653')
SEM_ERROR     = colors.HexColor('#9d5852')
SEM_INFO      = colors.HexColor('#4b79a8')

TABLE_HEADER_COLOR = HEADER_FILL
TABLE_HEADER_TEXT  = colors.white
TABLE_ROW_EVEN     = colors.white
TABLE_ROW_ODD      = TABLE_STRIPE

# ─────────────────────────────────────────────────────────────────────────────
# FONT REGISTRATION
# ─────────────────────────────────────────────────────────────────────────────
FONT_DIR = '/usr/share/fonts'

pdfmetrics.registerFont(TTFont('NotoSerifSC',      f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSerifSC-Bold', f'{FONT_DIR}/truetype/noto-serif-sc/NotoSerifSC-Bold.ttf'))
# Use SarasaMonoSC for code/mono, and Liberation Sans as the sans-serif fallback
pdfmetrics.registerFont(TTFont('SarasaMonoSC',     f'{FONT_DIR}/truetype/chinese/SarasaMonoSC-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SarasaMonoSC-Bold',f'{FONT_DIR}/truetype/chinese/SarasaMonoSC-Bold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif',        f'{FONT_DIR}/truetype/freefont/FreeSerif.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Bold',   f'{FONT_DIR}/truetype/freefont/FreeSerifBold.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-Italic', f'{FONT_DIR}/truetype/freefont/FreeSerifItalic.ttf'))
pdfmetrics.registerFont(TTFont('FreeSerif-BoldItalic', f'{FONT_DIR}/truetype/freefont/FreeSerifBoldItalic.ttf'))
pdfmetrics.registerFont(TTFont('DejaVuSans',       f'{FONT_DIR}/truetype/dejavu/DejaVuSansMono.ttf'))

registerFontFamily('NotoSerifSC', normal='NotoSerifSC', bold='NotoSerifSC-Bold')
registerFontFamily('SarasaMonoSC', normal='SarasaMonoSC', bold='SarasaMonoSC-Bold')
registerFontFamily('FreeSerif', normal='FreeSerif', bold='FreeSerif-Bold',
                   italic='FreeSerif-Italic', boldItalic='FreeSerif-BoldItalic')
registerFontFamily('DejaVuSans', normal='DejaVuSans', bold='DejaVuSans')

install_font_fallback()

# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENT CONFIG
# ─────────────────────────────────────────────────────────────────────────────
OUTPUT_PATH = "/home/z/my-project/scripts/body.pdf"
DIAGRAMS_DIR = "/home/z/my-project/scripts/diagrams"

PAGE_WIDTH, PAGE_HEIGHT = A4  # 595.28 x 841.89 pt
LEFT_MARGIN = 0.85 * inch
RIGHT_MARGIN = 0.85 * inch
TOP_MARGIN = 0.85 * inch
BOTTOM_MARGIN = 0.85 * inch
AVAILABLE_WIDTH = PAGE_WIDTH - LEFT_MARGIN - RIGHT_MARGIN  # ~ 415pt

# ─────────────────────────────────────────────────────────────────────────────
# PARAGRAPH STYLES
# ─────────────────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

style_h1 = ParagraphStyle(
    name='H1', fontName='NotoSerifSC-Bold', fontSize=20, leading=26,
    textColor=HEADER_FILL, spaceBefore=18, spaceAfter=8,
    alignment=TA_LEFT, wordWrap='CJK',
)
style_h2 = ParagraphStyle(
    name='H2', fontName='NotoSerifSC-Bold', fontSize=14, leading=20,
    textColor=HEADER_FILL, spaceBefore=14, spaceAfter=6,
    alignment=TA_LEFT, wordWrap='CJK',
)
style_h3 = ParagraphStyle(
    name='H3', fontName='NotoSerifSC-Bold', fontSize=11.5, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=10, spaceAfter=4,
    alignment=TA_LEFT, wordWrap='CJK',
)
style_body = ParagraphStyle(
    name='Body', fontName='NotoSerifSC', fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=8,
    alignment=TA_LEFT, wordWrap='CJK', firstLineIndent=0,
)
style_body_justify = ParagraphStyle(
    name='BodyJustify', fontName='NotoSerifSC', fontSize=10.5, leading=16,
    textColor=TEXT_PRIMARY, spaceBefore=0, spaceAfter=8,
    alignment=TA_JUSTIFY, wordWrap='CJK',
)
style_bullet = ParagraphStyle(
    name='Bullet', fontName='NotoSerifSC', fontSize=10.5, leading=15,
    textColor=TEXT_PRIMARY, leftIndent=18, spaceBefore=0, spaceAfter=3,
    alignment=TA_LEFT, wordWrap='CJK',
)
style_caption = ParagraphStyle(
    name='Caption', fontName='NotoSerifSC', fontSize=9, leading=12,
    textColor=TEXT_MUTED, alignment=TA_CENTER, spaceBefore=4, spaceAfter=14,
    wordWrap='CJK',
)
style_table_header = ParagraphStyle(
    name='TableHeader', fontName='NotoSerifSC-Bold', fontSize=10, leading=13,
    textColor=colors.white, alignment=TA_CENTER, wordWrap='CJK',
)
style_table_cell = ParagraphStyle(
    name='TableCell', fontName='NotoSerifSC', fontSize=9.5, leading=12.5,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
)
style_table_cell_center = ParagraphStyle(
    name='TableCellCenter', fontName='NotoSerifSC', fontSize=9.5, leading=12.5,
    textColor=TEXT_PRIMARY, alignment=TA_CENTER, wordWrap='CJK',
)
style_table_cell_code = ParagraphStyle(
    name='TableCellCode', fontName='SarasaMonoSC', fontSize=9, leading=12,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
)
style_code = ParagraphStyle(
    name='Code', fontName='SarasaMonoSC', fontSize=8.5, leading=11.5,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
    leftIndent=8, rightIndent=8, spaceBefore=6, spaceAfter=10,
    backColor=CARD_BG, borderColor=BORDER, borderWidth=0.5,
    borderPadding=6,
)
style_note = ParagraphStyle(
    name='Note', fontName='NotoSerifSC', fontSize=9.5, leading=14,
    textColor=TEXT_PRIMARY, alignment=TA_LEFT, wordWrap='CJK',
    leftIndent=12, rightIndent=12, spaceBefore=4, spaceAfter=10,
    backColor=colors.HexColor('#fdfaf2'), borderColor=ACCENT,
    borderWidth=0, borderPadding=8,
)
style_callout = ParagraphStyle(
    name='Callout', fontName='NotoSerifSC-Bold', fontSize=10.5, leading=15,
    textColor=HEADER_FILL, alignment=TA_LEFT, wordWrap='CJK',
    leftIndent=12, rightIndent=12, spaceBefore=6, spaceAfter=10,
    backColor=colors.HexColor('#f2f9f4'), borderColor=SEM_SUCCESS,
    borderWidth=0, borderPadding=8,
)
style_toc_h1 = ParagraphStyle(
    name='TOCH1', fontName='NotoSerifSC-Bold', fontSize=11.5, leading=18,
    textColor=HEADER_FILL, leftIndent=0, spaceBefore=4, spaceAfter=2,
)
style_toc_h2 = ParagraphStyle(
    name='TOCH2', fontName='NotoSerifSC', fontSize=10, leading=14,
    textColor=TEXT_PRIMARY, leftIndent=22, spaceBefore=2, spaceAfter=2,
)
style_toc_title = ParagraphStyle(
    name='TOCTitle', fontName='NotoSerifSC-Bold', fontSize=22, leading=28,
    textColor=HEADER_FILL, alignment=TA_CENTER, spaceBefore=0, spaceAfter=18,
)

# ─────────────────────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def add_heading(text, style, level=0, story=None):
    """Add a heading with bookmark for TOC."""
    key = 'h_' + hashlib.md5(text.encode()).hexdigest()[:8]
    p = Paragraph(f'<a name="{key}"/>{text}', style)
    p.bookmark_name = key
    p.bookmark_level = level
    p.bookmark_text = text
    p.bookmark_key = key
    if story is not None:
        story.append(p)
    return p

def add_section_heading(text, story, level=0):
    """Add H1/H2 with orphan protection."""
    style = style_h1 if level == 0 else style_h2
    threshold = 100 if level == 0 else 60
    story.append(CondPageBreak(threshold))
    add_heading(text, style, level=level, story=story)
    if level == 0:
        story.append(HRFlowable(width="100%", color=ACCENT, thickness=1.2,
                                spaceBefore=2, spaceAfter=10))

def add_image(path, max_width=None, max_height=None, caption=None, story=None):
    """Embed image preserving aspect ratio."""
    if max_width is None:
        max_width = AVAILABLE_WIDTH
    if max_height is None:
        max_height = PAGE_HEIGHT * 0.55
    pil_img = PILImage.open(path)
    orig_w, orig_h = pil_img.size
    ratio_w = max_width / orig_w if orig_w > 0 else 1.0
    ratio_h = max_height / orig_h if orig_h > 0 else 1.0
    ratio = min(ratio_w, ratio_h, 1.0) if (orig_w > max_width or orig_h > max_height) else min(ratio_w, ratio_h)
    img = Image(path, width=orig_w * ratio, height=orig_h * ratio)
    img.hAlign = 'CENTER'
    if story is not None:
        story.append(Spacer(1, 6))
        story.append(img)
        if caption:
            story.append(Paragraph(caption, style_caption))
    return img

def build_table(data, col_widths=None, header_rows=1, stripe=True):
    """Build a styled table. `data` should be list of lists of Paragraph or string."""
    if col_widths is None:
        # Equal columns
        n = len(data[0])
        col_widths = [AVAILABLE_WIDTH / n] * n
    # Scale to available width if too narrow
    total = sum(col_widths)
    if total < AVAILABLE_WIDTH * 0.85:
        scale = AVAILABLE_WIDTH * 0.95 / total
        col_widths = [w * scale for w in col_widths]
    elif total > AVAILABLE_WIDTH:
        scale = AVAILABLE_WIDTH / total
        col_widths = [w * scale for w in col_widths]
    t = Table(data, colWidths=col_widths, hAlign='CENTER', repeatRows=header_rows)
    style_cmds = [
        ('BACKGROUND', (0, 0), (-1, header_rows - 1), TABLE_HEADER_COLOR),
        ('TEXTCOLOR', (0, 0), (-1, header_rows - 1), TABLE_HEADER_TEXT),
        ('FONTNAME', (0, 0), (-1, header_rows - 1), 'NotoSerifSC-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
    ]
    if stripe:
        for r in range(header_rows, len(data)):
            if (r - header_rows) % 2 == 1:
                style_cmds.append(('BACKGROUND', (0, r), (-1, r), TABLE_ROW_ODD))
            else:
                style_cmds.append(('BACKGROUND', (0, r), (-1, r), TABLE_ROW_EVEN))
    t.setStyle(TableStyle(style_cmds))
    return t

def cell(text, style=None):
    """Wrap text in Paragraph for table cell."""
    if style is None:
        style = style_table_cell
    return Paragraph(str(text), style)

def code_block(code_text):
    """Render code as Preformatted block."""
    return Preformatted(code_text, style_code)

# ─────────────────────────────────────────────────────────────────────────────
# TOC DOC TEMPLATE
# ─────────────────────────────────────────────────────────────────────────────
class TocDocTemplate(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        if hasattr(flowable, 'bookmark_name'):
            level = getattr(flowable, 'bookmark_level', 0)
            text = getattr(flowable, 'bookmark_text', '')
            key = getattr(flowable, 'bookmark_key', '')
            self.notify('TOCEntry', (level, text, self.page, key))

# ─────────────────────────────────────────────────────────────────────────────
# PAGE TEMPLATE (header/footer with page numbers)
# ─────────────────────────────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    # Footer: page number centered
    canvas.setFont('FreeSerif', 9)
    canvas.setFillColor(TEXT_MUTED)
    page_num = canvas.getPageNumber()
    canvas.drawCentredString(PAGE_WIDTH / 2, 0.5 * inch, str(page_num))
    # Footer rule
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.5)
    canvas.line(LEFT_MARGIN, 0.7 * inch, PAGE_WIDTH - RIGHT_MARGIN, 0.7 * inch)
    # Header: document title (small)
    canvas.setFont('NotoSerifSC', 8)
    canvas.setFillColor(TEXT_MUTED)
    canvas.drawString(LEFT_MARGIN, PAGE_HEIGHT - 0.5 * inch,
                      "Projeto de Modelagem UML — Food Delivery System")
    canvas.drawRightString(PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 0.5 * inch,
                           "v1.0")
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.4)
    canvas.line(LEFT_MARGIN, PAGE_HEIGHT - 0.6 * inch,
                PAGE_WIDTH - RIGHT_MARGIN, PAGE_HEIGHT - 0.6 * inch)
    canvas.restoreState()

# ─────────────────────────────────────────────────────────────────────────────
# BUILD STORY
# ─────────────────────────────────────────────────────────────────────────────

def build_story():
    story = []

    # ═══════════════════════════════════════════════════════════════════════
    # SUMÁRIO (TOC)
    # ═══════════════════════════════════════════════════════════════════════
    story.append(Paragraph("Sumário", style_toc_title))
    story.append(HRFlowable(width="40%", color=ACCENT, thickness=1.5,
                            spaceBefore=0, spaceAfter=14, hAlign='CENTER'))

    toc = TableOfContents()
    toc.levelStyles = [style_toc_h1, style_toc_h2]
    story.append(toc)
    story.append(PageBreak())

    # ═══════════════════════════════════════════════════════════════════════
    # 1. INTRODUÇÃO E CONTEXTO DO PROJETO
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("1. Introdução e Contexto do Projeto", story, level=0)

    add_section_heading("1.1 Visão Geral do Sistema", story, level=1)
    story.append(Paragraph(
        "Este documento apresenta o projeto completo de modelagem UML de uma plataforma de "
        "<b>delivery de comida</b> (food delivery) desenvolvida para uma startup em fase de "
        "crescimento que já conta com mais de 500 restaurantes parceiros cadastrados. "
        "A modelagem foi conduzida segundo as boas práticas de Engenharia de Software e "
        "segundo a notação UML 2.5 (ISO/IEC 19505), cobrindo desde o levantamento de requisitos "
        "até a especificação de classes, objetos, pacotes e fluxos de interação entre componentes.",
        style_body_justify))
    story.append(Paragraph(
        "O sistema modelado atende a quatro perfis distintos de usuários: <b>clientes</b> que "
        "realizam pedidos e acompanham entregas em tempo real; <b>restaurantes</b> parceiros "
        "que gerenciam cardápios, aceitam pedidos e criam promoções; <b>entregadores</b> "
        "autônomos que recebem notificações de entrega e atualizam status; e "
        "<b>administradores</b> da plataforma responsáveis por métricas, moderação e gestão "
        "financeira. A arquitetura prevê ainda integração com <b>atores externos</b> como "
        "gateways de pagamento e serviços de mapeamento.",
        style_body_justify))
    story.append(Paragraph(
        "A escolha por uma modelagem UML completa — em vez de especificações informais — "
        "justifica-se pela complexidade do domínio: transações financeiras, geolocalização "
        "em tempo real, comunicação assíncrona entre atores e múltiplas regras de negócio "
        "(cupons, reembolsos, comissões). Diagramas formais reduzem ambiguidades na "
        "comunicação entre stakeholders técnicos e não técnicos, além de servirem como "
        "contrato de implementação para a equipe de desenvolvimento.",
        style_body_justify))

    add_section_heading("1.2 Objetivos do Projeto", story, level=1)
    story.append(Paragraph(
        "O projeto tem por objetivos: (i) <b>mapear o domínio funcional</b> do sistema de "
        "delivery, identificando atores, casos de uso e seus relacionamentos; "
        "(ii) <b>estruturar o modelo de classes</b> com responsabilidades claras e baixo "
        "acoplamento, seguindo princípios SOLID; (iii) <b>documentar a arquitetura em camadas</b> "
        "por meio do diagrama de pacotes, separando apresentação, negócio, dados e integrações; "
        "(iv) <b>exemplificar o comportamento dinâmico</b> do sistema através de diagramas de "
        "sequência e objetos; e (v) <b>fornecer um exemplo de implementação</b> em Java que "
        "demonstre como relacionamentos UML como <<include>> e <<extend>> "
        "se traduzem em código executável.",
        style_body_justify))

    add_section_heading("1.3 Escopo", story, level=1)
    story.append(Paragraph(
        "O escopo cobre as funcionalidades essenciais de um aplicativo de delivery moderno: "
        "autenticação de usuários, catálogo de restaurantes com busca e filtros, carrinho de "
        "compras, checkout com múltiplos métodos de pagamento, rastreamento em tempo real, "
        "avaliações, gestão de cardápio, atribuição de entregas, cupons de desconto, chat "
        "cliente-entregador, histórico de pedidos, cancelamentos e reembolsos, gestão de "
        "múltiplos endereços, notificações push e painel administrativo com métricas.",
        style_body_justify))
    story.append(Paragraph(
        "Estão fora do escopo deste documento: detalhes de implementação de infraestrutura "
        "(Kubernetes, CI/CD), contratos de API REST específicos, modelagem de banco de dados "
        "relacional (DER), plano de testes e estratégia de monitoramento em produção. "
        "Esses artefatos seriam produzidos em fases subsequentes do ciclo de desenvolvimento.",
        style_body_justify))

    add_section_heading("1.4 Público-Alvo", story, level=1)
    story.append(Paragraph(
        "O sistema atende a quatro perfis principais de usuários, cada um com fluxos e "
        "permissões distintos. A tabela abaixo resume os perfis, suas responsabilidades e "
        "canais de acesso preferenciais.",
        style_body_justify))

    stakeholder_data = [
        [cell('<b>Perfil</b>', style_table_header),
         cell('<b>Responsabilidades</b>', style_table_header),
         cell('<b>Canal de Acesso</b>', style_table_header)],
        [cell('Cliente'),
         cell('Realizar pedidos, pagar, rastrear entrega, avaliar restaurantes e entregadores, gerenciar endereços e cupons'),
         cell('App Mobile (iOS/Android)')],
        [cell('Restaurante'),
         cell('Gerenciar cardápio, aceitar/rejeitar pedidos, criar promoções, acompanhar métricas de vendas'),
         cell('Web App / Tablet')],
        [cell('Entregador'),
         cell('Receber notificações de entrega, aceitar/recusar, navegar via GPS, atualizar status, confirmar entrega'),
         cell('App Mobile (Android)')],
        [cell('Administrador'),
         cell('Gerenciar usuários, aprovar restaurantes, monitorar transações, gerar relatórios, resolver conflitos'),
         cell('Web Admin (Desktop)')],
        [cell('Sistema de Pagamento', style_table_cell),
         cell('Ator externo: processa transações via cartão, PIX e carteira digital; retorna confirmação ou falha', style_table_cell),
         cell('API REST (gateway)', style_table_cell)],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(stakeholder_data, col_widths=[0.20*AVAILABLE_WIDTH, 0.55*AVAILABLE_WIDTH, 0.25*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 1.1 — Perfis de usuários e atores do sistema", style_caption))

    add_section_heading("1.5 Plataforma e Stack Tecnológica", story, level=1)
    story.append(Paragraph(
        "A plataforma é composta por três aplicativos móveis distintos (cliente, entregador e "
        "restaurante), um painel web administrativo e serviços de backend. A stack recomendada "
        "para implementação inclui technologies consolidadas no mercado, conforme detalhado na "
        "seção de diferenciais do sistema.",
        style_body_justify))
    story.append(Paragraph(
        "A camada mobile pode ser desenvolvida em React Native ou Flutter para reduzir o esforço "
        "de manutenção multiplataforma. O backend deve seguir arquitetura de microsserviços "
        "com API Gateway, utilizando Node.js + TypeScript ou Spring Boot (Java/Kotlin) para "
        "serviços de domínio. A persistência utiliza PostgreSQL para dados transacionais, "
        "Redis para cache e filas, e MongoDB opcional para logs de auditoria.",
        style_body_justify))

    # ═══════════════════════════════════════════════════════════════════════
    # 2. LEVANTAMENTO DE REQUISITOS
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("2. Levantamento de Requisitos", story, level=0)

    story.append(Paragraph(
        "O levantamento de requisitos é a fase fundamental que define <b>o que</b> o sistema "
        "deve fazer (Requisitos Funcionais — RF) e <b>como</b> deve se comportar em termos de "
        "qualidade (Requisitos Não Funcionais — RNF). Esta seção apresenta 15 requisitos "
        "funcionais e 12 requisitos não funcionais, organizados por categoria e prioridade. "
        "A priorização segue a técnica MoSCoW (Must, Should, Could), simplificada em "
        "Alta/Média/Baixa para fins didáticos.",
        style_body_justify))

    add_section_heading("2.1 Requisitos Funcionais (RF)", story, level=1)
    story.append(Paragraph(
        "Requisitos funcionais descrevem as funcionalidades específicas que o sistema deve "
        "oferecer aos usuários. Cada requisito possui um identificador único (RF-XX), "
        "descrição, categoria e prioridade. A prioridade <b>Alta</b> indica funcionalidades "
        "essenciais para o MVP; <b>Média</b> indica recursos importantes para lançamento "
        "completo; <b>Baixa</b> indica melhorias incrementais pós-lançamento.",
        style_body_justify))

    rf_data = [
        [cell('<b>ID</b>', style_table_header),
         cell('<b>Descrição</b>', style_table_header),
         cell('<b>Categoria</b>', style_table_header),
         cell('<b>Prior.</b>', style_table_header)],
        [cell('RF-01', style_table_cell_center),
         cell('Cadastro e autenticação de usuários (clientes, entregadores e restaurantes) com validação de e-mail, CPF/CNPJ e telefone'),
         cell('Acesso', style_table_cell_center),
         cell('Alta', style_table_cell_center)],
        [cell('RF-02', style_table_cell_center),
         cell('Busca e filtro de restaurantes por categoria, localização (raio em km), avaliação média e tempo de entrega'),
         cell('Catálogo', style_table_cell_center),
         cell('Alta', style_table_cell_center)],
        [cell('RF-03', style_table_cell_center),
         cell('Realização de pedidos com carrinho de compras: adicionar/remover itens, definir quantidade, observações por item'),
         cell('Pedido', style_table_cell_center),
         cell('Alta', style_table_cell_center)],
        [cell('RF-04', style_table_cell_center),
         cell('Pagamento online integrado com cartão de crédito, PIX e carteira digital, com confirmação assíncrona via webhook'),
         cell('Pagamento', style_table_cell_center),
         cell('Alta', style_table_cell_center)],
        [cell('RF-05', style_table_cell_center),
         cell('Rastreamento de pedido em tempo real com atualização de localização do entregador a cada 5 segundos via WebSocket'),
         cell('Rastreamento', style_table_cell_center),
         cell('Alta', style_table_cell_center)],
        [cell('RF-06', style_table_cell_center),
         cell('Avaliação de restaurantes e entregadores com nota de 1 a 5 estrelas, comentário opcional e moderação administrativa'),
         cell('Avaliação', style_table_cell_center),
         cell('Média', style_table_cell_center)],
        [cell('RF-07', style_table_cell_center),
         cell('Gestão de cardápio pelos restaurantes: cadastrar produtos com foto, descrição, preço, categoria e disponibilidade'),
         cell('Cardápio', style_table_cell_center),
         cell('Alta', style_table_cell_center)],
        [cell('RF-08', style_table_cell_center),
         cell('Atribuição automática de entregas aos entregadores disponíveis com base em localização, veículo e algoritmo de matching'),
         cell('Logística', style_table_cell_center),
         cell('Alta', style_table_cell_center)],
        [cell('RF-09', style_table_cell_center),
         cell('Gestão de promoções e cupons de desconto: percentual, fixo, frete grátis, validade, limite de usos e segmentação por cliente'),
         cell('Marketing', style_table_cell_center),
         cell('Média', style_table_cell_center)],
        [cell('RF-10', style_table_cell_center),
         cell('Chat em tempo real entre cliente e entregador durante o ciclo de entrega, com histórico persistente por 30 dias'),
         cell('Comunicação', style_table_cell_center),
         cell('Média', style_table_cell_center)],
        [cell('RF-11', style_table_cell_center),
         cell('Histórico de pedidos com filtros por período, status e restaurante, permitindo refazer pedidos com um toque'),
         cell('Pedido', style_table_cell_center),
         cell('Média', style_table_cell_center)],
        [cell('RF-12', style_table_cell_center),
         cell('Cancelamento e reembolso de pedidos com regras de negócio por status, prazo e motivo, integrado ao gateway de pagamento'),
         cell('Pedido', style_table_cell_center),
         cell('Alta', style_table_cell_center)],
        [cell('RF-13', style_table_cell_center),
         cell('Gestão de múltiplos endereços de entrega por cliente com geolocalização via Google Maps e validação de CEP'),
         cell('Endereço', style_table_cell_center),
         cell('Média', style_table_cell_center)],
        [cell('RF-14', style_table_cell_center),
         cell('Notificações push de status do pedido (criado, aceito, em preparo, saiu para entrega, entregue) via Firebase Cloud Messaging'),
         cell('Notificação', style_table_cell_center),
         cell('Alta', style_table_cell_center)],
        [cell('RF-15', style_table_cell_center),
         cell('Painel administrativo com métricas em tempo real: GMV, ticket médio, restaurantes ativos, NPS e relatórios exportáveis (CSV/PDF)'),
         cell('Admin', style_table_cell_center),
         cell('Média', style_table_cell_center)],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(rf_data, col_widths=[0.10*AVAILABLE_WIDTH, 0.55*AVAILABLE_WIDTH, 0.20*AVAILABLE_WIDTH, 0.15*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 2.1 — Requisitos Funcionais do Sistema (RF-01 a RF-15)", style_caption))

    add_section_heading("2.2 Requisitos Não Funcionais (RNF)", story, level=1)
    story.append(Paragraph(
        "Requisitos não funcionais especificam os atributos de qualidade que o sistema deve "
        "possuir: performance, escalabilidade, disponibilidade, segurança, conformidade legal, "
        "usabilidade, entre outros. Estes requisitos são frequentemente mais críticos que os "
        "funcionais, pois determinam a viabilidade operacional e a experiência do usuário em "
        "escala. Cada RNF deve ser mensurável e testável.",
        style_body_justify))

    rnf_data = [
        [cell('<b>ID</b>', style_table_header),
         cell('<b>Categoria</b>', style_table_header),
         cell('<b>Especificação Mensurável</b>', style_table_header),
         cell('<b>Métrica</b>', style_table_header)],
        [cell('RNF-01', style_table_cell_center),
         cell('Performance', style_table_cell_center),
         cell('Tempo de resposta das APIs críticas (busca, pedido, pagamento) inferior a 1,5 segundos no percentil 95'),
         cell('p95 < 1.500ms', style_table_cell_center)],
        [cell('RNF-02', style_table_cell_center),
         cell('Escalabilidade', style_table_cell_center),
         cell('Suportar até 10.000 pedidos simultâneos com autoescaling horizontal dos microsserviços'),
         cell('10k ops/s', style_table_cell_center)],
        [cell('RNF-03', style_table_cell_center),
         cell('Disponibilidade', style_table_cell_center),
         cell('Uptime de 99,95% (máximo de 4,38 horas de downtime por ano) com failover automático entre regiões'),
         cell('99,95% uptime', style_table_cell_center)],
        [cell('RNF-04', style_table_cell_center),
         cell('Segurança', style_table_cell_center),
         cell('Criptografia AES-256 em repouso para dados sensíveis, TLS 1.3 em trânsito, senhas com bcrypt (cost 12)'),
         cell('AES-256 / TLS 1.3', style_table_cell_center)],
        [cell('RNF-05', style_table_cell_center),
         cell('Conformidade', style_table_cell_center),
         cell('Conformidade total com LGPD: consentimento explícito, direito ao esquecimento, registro de operações com dados pessoais'),
         cell('LGPD 100%', style_table_cell_center)],
        [cell('RNF-06', style_table_cell_center),
         cell('Usabilidade', style_table_cell_center),
         cell('Interface intuitiva com no máximo 3 toques para concluir um pedido a partir da tela inicial'),
         cell('≤ 3 toques', style_table_cell_center)],
        [cell('RNF-07', style_table_cell_center),
         cell('Compatibilidade', style_table_cell_center),
         cell('Suporte a Android 8.0+ (API 26+) e iOS 13.0+, cobrindo 95% dos dispositivos ativos no mercado brasileiro'),
         cell('Android 8+ / iOS 13+', style_table_cell_center)],
        [cell('RNF-08', style_table_cell_center),
         cell('Geolocalização', style_table_cell_center),
         cell('Precisão de localização inferior a 10 metros em ambiente urbano, utilizando GPS assistido por Wi-Fi e torres celulares'),
         cell('≤ 10m', style_table_cell_center)],
        [cell('RNF-09', style_table_cell_center),
         cell('Integração', style_table_cell_center),
         cell('Integração com gateways de pagamento (Stripe, Mercado Pago) via API REST com idempotência e retry exponencial'),
         cell('99,9% success', style_table_cell_center)],
        [cell('RNF-10', style_table_cell_center),
         cell('Backup', style_table_cell_center),
         cell('Backup automatizado a cada 6 horas com RPO de 15 minutos e RTO inferior a 30 minutos para recuperação de desastres'),
         cell('RTO < 30min', style_table_cell_center)],
        [cell('RNF-11', style_table_cell_center),
         cell('Acessibilidade', style_table_cell_center),
         cell('Suporte a leitores de tela (TalkBack/VoiceOver), contraste WCAG AA, suporte a fontes ampliadas até 200%'),
         cell('WCAG 2.1 AA', style_table_cell_center)],
        [cell('RNF-12', style_table_cell_center),
         cell('Internacionalização', style_table_cell_center),
         cell('Arquitetura i18n com suporte inicial a Português, Inglês e Espanhol, com tradução de UI, moeda e fuso horário'),
         cell('3 idiomas', style_table_cell_center)],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(rnf_data, col_widths=[0.10*AVAILABLE_WIDTH, 0.18*AVAILABLE_WIDTH, 0.50*AVAILABLE_WIDTH, 0.22*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 2.2 — Requisitos Não Funcionais do Sistema (RNF-01 a RNF-12)", style_caption))

    add_section_heading("2.3 Matriz de Priorização", story, level=1)
    story.append(Paragraph(
        "A matriz abaixo consolida a distribuição dos requisitos por prioridade e categoria. "
        "Observa-se que 8 dos 15 requisitos funcionais (53%) são classificados como prioridade "
        "Alta, refletindo o foco do MVP em funcionalidades essenciais de pedido, pagamento e "
        "rastreamento. Os requisitos de prioridade Baixa não foram incluídos pois dependem de "
        "validação de mercado pós-MVP.",
        style_body_justify))

    prio_data = [
        [cell('<b>Prioridade</b>', style_table_header),
         cell('<b>Quantidade RF</b>', style_table_header),
         cell('<b>Percentual</b>', style_table_header),
         cell('<b>Fase de Entrega</b>', style_table_header)],
        [cell('Alta', style_table_cell_center), cell('8', style_table_cell_center),
         cell('53%', style_table_cell_center), cell('MVP — 3 meses', style_table_cell_center)],
        [cell('Média', style_table_cell_center), cell('7', style_table_cell_center),
         cell('47%', style_table_cell_center), cell('V1.0 — 6 meses', style_table_cell_center)],
        [cell('Baixa', style_table_cell_center), cell('0', style_table_cell_center),
         cell('0%', style_table_cell_center), cell('Pós-validação', style_table_cell_center)],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(prio_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.20*AVAILABLE_WIDTH, 0.20*AVAILABLE_WIDTH, 0.35*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 2.3 — Matriz de priorização dos requisitos funcionais", style_caption))

    # ═══════════════════════════════════════════════════════════════════════
    # 3. DIAGRAMA DE CASOS DE USO
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("3. Diagrama de Casos de Uso", story, level=0)

    story.append(Paragraph(
        "O diagrama de casos de uso captura a visão externa do sistema, descrevendo as "
        "interações entre atores (humanos ou sistemas externos) e as funcionalidades que o "
        "sistema oferece. É o diagrama mais utilizado para comunicação com stakeholders não "
        "técnicos, pois não exige conhecimento de programação. A notação empregada segue a "
        "UML 2.5 e inclui os estereótipos <i><<include>></i> (comportamento "
        "obrigatório compartilhado) e <i><<extend>></i> (comportamento opcional "
        "condicional).",
        style_body_justify))

    add_section_heading("3.1 Atores do Sistema", story, level=1)
    story.append(Paragraph(
        "Foram identificados cinco atores no sistema, sendo quatro primários (que iniciam "
        "interações) e um secundário (ator externo que responde a chamadas do sistema). "
        "Atores primários são representados por figuras humanóides padrão; atores externos "
        "mantêm a mesma notação mas recebem rótulo <<external>> quando necessário.",
        style_body_justify))
    actors_data = [
        [cell('<b>Ator</b>', style_table_header), cell('<b>Tipo</b>', style_table_header),
         cell('<b>Descrição</b>', style_table_header)],
        [cell('Cliente'), cell('Primário', style_table_cell_center),
         cell('Usuário final que realiza pedidos, efetua pagamentos, rastreia entregas, avalia estabelecimentos e gerencia seu perfil e endereços')],
        [cell('Restaurante'), cell('Primário', style_table_cell_center),
         cell('Estabelecimento parceiro que gerencia cardápio, aceita ou rejeita pedidos, cria promoções e acompanha métricas de venda')],
        [cell('Entregador'), cell('Primário', style_table_cell_center),
         cell('Parceiro autônomo que recebe solicitações de entrega, navega até o restaurante e o cliente, atualiza status e confirma entrega')],
        [cell('Administrador'), cell('Primário', style_table_cell_center),
         cell('Funcionário da startup que opera o painel administrativo, gerencia usuários, aprova restaurantes, monitora transações e gera relatórios')],
        [cell('Sistema de Pagamento'), cell('Externo', style_table_cell_center),
         cell('Gateway de pagamento externo (Stripe, Mercado Pago) que processa transações financeiras e retorna confirmações via webhook')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(actors_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.15*AVAILABLE_WIDTH, 0.60*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 3.1 — Atores identificados no sistema", style_caption))

    add_section_heading("3.2 Diagrama de Casos de Uso", story, level=1)
    add_image(os.path.join(DIAGRAMS_DIR, "usecase.png"),
              max_width=AVAILABLE_WIDTH, max_height=PAGE_HEIGHT * 0.62,
              caption="Figura 3.1 — Diagrama de casos de uso do Sistema Food Delivery", story=story)

    add_section_heading("3.3 Descrição Textual dos Casos de Uso Principais", story, level=1)
    story.append(Paragraph(
        "A seguir são detalhados os cinco casos de uso mais críticos do sistema, em formato "
        "estruturado com ator, pré-condição, fluxo principal, fluxos alternativos, pós-condição "
        "e exceções. Esta especificação é essencial para que desenvolvedores e QA entendam o "
        "comportamento esperado sem ambiguidades.",
        style_body_justify))

    # UC1 - Fazer Pedido
    add_section_heading("UC-01: Fazer Pedido", story, level=2)
    uc1_data = [
        [cell('<b>Aspecto</b>', style_table_header), cell('<b>Descrição</b>', style_table_header)],
        [cell('Ator Principal', style_table_cell_center), cell('Cliente')],
        [cell('Pré-condição', style_table_cell_center), cell('Cliente está autenticado no aplicativo e possui ao menos um endereço de entrega cadastrado')],
        [cell('Fluxo Principal', style_table_cell_center),
         cell('1. Cliente busca restaurante ou seleciona da lista<br/>2. Sistema exibe cardápio do restaurante<br/>3. Cliente adiciona itens ao carrinho com quantidade e observações<br/>4. Cliente revisa o carrinho e valor total<br/>5. Cliente seleciona endereço de entrega<br/>6. <<include>> Sistema verifica disponibilidade dos itens<br/>7. Cliente seleciona método de pagamento<br/>8. <<include>> Sistema processa pagamento via gateway externo<br/>9. <<extend>> Cliente aplica cupom de desconto (opcional)<br/>10. Cliente confirma pedido<br/>11. Sistema cria pedido e notifica restaurante')],
        [cell('Fluxos Alternativos', style_table_cell_center),
         cell('A1: Item indisponível — Sistema sugere substituto ou remove do carrinho<br/>A2: Pagamento recusado — Sistema oferece novo método<br/>A3: Cliente agenda entrega para horário futuro (<<extend>> Agendar Entrega)')],
        [cell('Pós-condição', style_table_cell_center), cell('Pedido criado com status "Aguardando confirmação do restaurante" e notificação enviada')],
        [cell('Exceções', style_table_cell_center), cell('Restaurante fechado durante checkout; falha de comunicação com gateway; carrinho vazio')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(uc1_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.75*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 3.2 — Especificação do caso de uso Fazer Pedido", style_caption))

    # UC2 - Rastrear Pedido
    add_section_heading("UC-02: Rastrear Pedido", story, level=2)
    uc2_data = [
        [cell('<b>Aspecto</b>', style_table_header), cell('<b>Descrição</b>', style_table_header)],
        [cell('Ator Principal', style_table_cell_center), cell('Cliente')],
        [cell('Pré-condição', style_table_cell_center), cell('Cliente possui pedido ativo com status entre "Confirmado" e "Em entrega"')],
        [cell('Fluxo Principal', style_table_cell_center),
         cell('1. Cliente acessa tela "Meus Pedidos"<br/>2. Sistema lista pedidos ativos<br/>3. Cliente seleciona pedido para rastreamento<br/>4. <<include>> Sistema consulta localização atual do entregador<br/>5. Sistema exibe mapa com posição do entregador, rota e ETA<br/>6. Sistema atualiza posição a cada 5 segundos via WebSocket<br/>7. Cliente visualiza status em tempo real até "Entregue"')],
        [cell('Fluxos Alternativos', style_table_cell_center),
         cell('A1: Pedido ainda em preparo — Sistema mostra status do restaurante<br/>A2: Conexão WebSocket cai — App faz polling a cada 15 segundos como fallback')],
        [cell('Pós-condição', style_table_cell_center), cell('Cliente visualiza status atualizado até a entrega ser confirmada')],
        [cell('Exceções', style_table_cell_center), cell('GPS do entregador indisponível; pedido cancelado durante rastreamento')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(uc2_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.75*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 3.3 — Especificação do caso de uso Rastrear Pedido", style_caption))

    # UC3 - Aceitar Entrega
    add_section_heading("UC-03: Aceitar Entrega", story, level=2)
    uc3_data = [
        [cell('<b>Aspecto</b>', style_table_header), cell('<b>Descrição</b>', style_table_header)],
        [cell('Ator Principal', style_table_cell_center), cell('Entregador')],
        [cell('Pré-condição', style_table_cell_center), cell('Entregador está autenticado, online e com status "disponível" no app')],
        [cell('Fluxo Principal', style_table_cell_center),
         cell('1. Sistema identifica novo pedido pronto para coleta próximo ao entregador<br/>2. Sistema envia notificação push com detalhes (restaurante, endereço, valor)<br/>3. Entregador visualiza oferta e toca em "Aceitar"<br/>4. <<include>> Sistema verifica rota ótima até o restaurante e o cliente<br/>5. Sistema confirma atribuição e bloqueia o pedido para outros entregadores<br/>6. Entregador navega até o restaurante para coleta<br/>7. Entregador atualiza status para "Em rota de entrega"')],
        [cell('Fluxos Alternativos', style_table_cell_center),
         cell('A1: Entregador recusa — Sistema oferta ao próximo entregador disponível<br/>A2: Nenhum entregador aceita em 5 minutos — Pedido entra em fila prioritária')],
        [cell('Pós-condição', style_table_cell_center), cell('Pedido atribuído ao entregador, status atualizado para "Saiu para entrega"')],
        [cell('Exceções', style_table_cell_center), cell('Entregador perde conexão; rota inviável por evento externo; <<extend>> Reportar Problema')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(uc3_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.75*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 3.4 — Especificação do caso de uso Aceitar Entrega", style_caption))

    # UC4 - Gerenciar Cardápio
    add_section_heading("UC-04: Gerenciar Cardápio", story, level=2)
    uc4_data = [
        [cell('<b>Aspecto</b>', style_table_header), cell('<b>Descrição</b>', style_table_header)],
        [cell('Ator Principal', style_table_cell_center), cell('Restaurante')],
        [cell('Pré-condição', style_table_cell_center), cell('Restaurante autenticado no painel administrativo e previamente aprovado pelo Administrador')],
        [cell('Fluxo Principal', style_table_cell_center),
         cell('1. Restaurante acessa aba "Cardápio"<br/>2. <<include>> Sistema lista produtos cadastrados com status (ativo/inativo)<br/>3. Restaurante pode: cadastrar novo produto, editar existente ou remover<br/>4. <<include>> Cadastrar Produto: nome, descrição, preço, categoria, foto, tempo de preparo<br/>5. <<include>> Atualizar Estoque: marcar como disponível/indisponível<br/>6. Sistema valida campos e salva alterações<br/>7. Sistema atualiza catálogo em tempo real para clientes visualizando')],
        [cell('Fluxos Alternativos', style_table_cell_center),
         cell('A1: Preço inválido — Sistema rejeita e exibe mensagem<br/>A2: Foto com formato não suportado — Sistema solicita nova upload')],
        [cell('Pós-condição', style_table_cell_center), cell('Cardápio do restaurante atualizado e visível para clientes em até 30 segundos')],
        [cell('Exceções', style_table_cell_center), cell('Upload de imagem falha; limite de produtos excedido; campos obrigatórios em branco')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(uc4_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.75*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 3.5 — Especificação do caso de uso Gerenciar Cardápio", style_caption))

    # UC5 - Processar Pagamento
    add_section_heading("UC-05: Processar Pagamento", story, level=2)
    uc5_data = [
        [cell('<b>Aspecto</b>', style_table_header), cell('<b>Descrição</b>', style_table_header)],
        [cell('Ator Principal', style_table_cell_center), cell('Sistema (interna), com Sistema de Pagamento como ator externo')],
        [cell('Pré-condição', style_table_cell_center), cell('Pedido criado com valor total calculado e itens confirmados como disponíveis')],
        [cell('Fluxo Principal', style_table_cell_center),
         cell('1. Sistema recebe solicitação de pagamento do App Mobile<br/>2. Sistema valida dados do pagamento (método, valor, cliente)<br/>3. Sistema gera ID interno de transação para idempotência<br/>4. Sistema envia requisição ao Gateway de Pagamento externo (Stripe/Mercado Pago)<br/>5. Gateway valida fundos e processa transação<br/>6. Gateway retorna confirmação com transactionId externo<br/>7. Sistema atualiza status do Pagamento para "Aprovado"<br/>8. Sistema libera pedido para o fluxo de preparação<br/>9. Sistema envia notificação ao cliente')],
        [cell('Fluxos Alternativos', style_table_cell_center),
         cell('A1: Gateway retorna "saldo insuficiente" — Sistema marca Pagamento como "Recusado" e notifica cliente<br/>A2: Timeout do gateway — Sistema faz retry com backoff exponencial (3 tentativas)<br/>A3: Webhook assíncrono recebido antes do timeout — Sistema reconcilia estados')],
        [cell('Pós-condição', style_table_cell_center), cell('Pagamento processado com sucesso ou registrado como falha para retry/manual')],
        [cell('Exceções', style_table_cell_center), cell('Indisponibilidade do gateway; dados de cartão inválidos; duplicação por retry mal implementado')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(uc5_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.75*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 3.6 — Especificação do caso de uso Processar Pagamento", style_caption))

    # ═══════════════════════════════════════════════════════════════════════
    # 4. DIAGRAMA DE CLASSES
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("4. Diagrama de Classes", story, level=0)

    story.append(Paragraph(
        "O diagrama de classes é o núcleo da modelagem orientada a objetos. Ele descreve a "
        "estrutura estática do sistema: classes, atributos, métodos e relacionamentos. "
        "Diferente dos casos de uso (visão externa) e da sequência (visão dinâmica), o "
        "diagrama de classes captura o <b>modelo de domínio</b> — as entidades que existem "
        "no problema e como elas se conectam. Esta seção apresenta dez classes principais "
        "do sistema de delivery, com herança, associação, agregação e composição.",
        style_body_justify))

    add_section_heading("4.1 Visão Geral das Classes", story, level=1)
    story.append(Paragraph(
        "A modelagem utiliza uma hierarquia com <b>Usuario</b> como classe abstrata base, "
        "especializada em <b>Cliente</b> e <b>Entregador</b>. Esta abstração evita duplicação "
        "de atributos comuns (id, nome, email, telefone, senha) e centraliza operações de "
        "autenticação. A classe <b>Pedido</b> atua como agregadora central, conectando-se a "
        "<b>Cliente</b>, <b>Restaurante</b>, <b>Entregador</b>, <b>Pagamento</b>, "
        "<b>Avaliacao</b> e compondo múltiplos <b>ItemPedido</b>. A separação entre "
        "<b>ItemPedido</b> e <b>Produto</b> é intencional: o ItemPedido registra o estado "
        "do produto no momento da compra (preço, observações), preservando o histórico "
        "mesmo se o Produto for posteriormente alterado.",
        style_body_justify))

    add_section_heading("4.2 Diagrama de Classes", story, level=1)
    add_image(os.path.join(DIAGRAMS_DIR, "class.png"),
              max_width=AVAILABLE_WIDTH, max_height=PAGE_HEIGHT * 0.65,
              caption="Figura 4.1 — Diagrama de classes do Sistema Food Delivery", story=story)

    add_section_heading("4.3 Descrição das Classes", story, level=1)
    classes_data = [
        [cell('<b>Classe</b>', style_table_header),
         cell('<b>Tipo</b>', style_table_header),
         cell('<b>Responsabilidade</b>', style_table_header)],
        [cell('Usuario', style_table_cell_center), cell('Abstract', style_table_cell_center),
         cell('Superclasse abstrata com atributos comuns a todos os usuários (id, nome, email, senha) e operações de autenticação e gestão de conta')],
        [cell('Cliente', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Especialização de Usuario que mantém endereços e cartões; executa fazerPedido(), avaliar() e cancelarPedido()')],
        [cell('Entregador', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Especialização de Usuario com CNH, veículo e disponibilidade; métodos aceitarEntrega(), atualizarStatus(), verificarRota()')],
        [cell('Restaurante', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Estabelecimento parceiro com CNPJ, avaliação média e tempo de entrega; gerencia cardápio, aceita pedidos e cria promoções')],
        [cell('Pedido', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Classe central que agrega todas as informações de uma transação: itens, cliente, restaurante, entregador, pagamento, status e valores')],
        [cell('ItemPedido', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Composição de Pedido: representa um item específico dentro de um pedido, com quantidade, preço unitário e observações')],
        [cell('Produto', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Item do cardápio do restaurante; agregado por Restaurante; referenciado por ItemPedido para manter preço histórico no pedido')],
        [cell('Pagamento', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Registra a transação financeira: valor, método (cartão/PIX/carteira), status, transacaoId do gateway e operações de processar/estornar')],
        [cell('Avaliacao', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Nota (1-5) e comentário deixado pelo cliente sobre um pedido; pode ser moderada pelo administrador')],
        [cell('Cupom', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Código promocional com desconto percentual ou fixo, validade e limites de uso; validado e aplicado a um Pedido')],
        [cell('Endereco', style_table_cell_center), cell('Concreta', style_table_cell_center),
         cell('Localização geográfica com logradouro, CEP e coordenadas; agregado por Cliente e usado em Pedido como destino de entrega')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(classes_data, col_widths=[0.18*AVAILABLE_WIDTH, 0.15*AVAILABLE_WIDTH, 0.67*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 4.1 — Descrição das classes do modelo de domínio", style_caption))

    add_section_heading("4.4 Relacionamentos entre Classes", story, level=1)
    story.append(Paragraph(
        "Os relacionamentos definem como as classes se conectam e colaboram. A correta "
        "escolha entre associação, agregação e composição impacta diretamente o ciclo de vida "
        "dos objetos e a integridade dos dados. A tabela abaixo detalha cada relacionamento, "
        "sua multiplicidade e justificativa.",
        style_body_justify))

    rel_data = [
        [cell('<b>Relacionamento</b>', style_table_header),
         cell('<b>Tipo</b>', style_table_header),
         cell('<b>Multiplicidade</b>', style_table_header),
         cell('<b>Justificativa</b>', style_table_header)],
        [cell('Cliente — Pedido'), cell('Associação', style_table_cell_center),
         cell('1 : *', style_table_cell_center),
         cell('Um cliente pode fazer múltiplos pedidos ao longo do tempo; cada pedido pertence a um único cliente')],
        [cell('Pedido — ItemPedido'), cell('Composição', style_table_cell_center),
         cell('1 : *', style_table_cell_center),
         cell('ItemPedido não existe sem o Pedido; se o pedido é cancelado, seus itens são removidos em cascata')],
        [cell('ItemPedido — Produto'), cell('Associação', style_table_cell_center),
         cell('* : 1', style_table_cell_center),
         cell('Vários itens podem referenciar o mesmo produto; o produto persiste mesmo após pedidos serem concluídos')],
        [cell('Restaurante — Produto'), cell('Agregação', style_table_cell_center),
         cell('1 : *', style_table_cell_center),
         cell('Restaurante agrega produtos como parte de seu cardápio; produtos podem existir teoricamente sem restaurante (catálogo genérico)')],
        [cell('Pedido — Pagamento'), cell('Associação', style_table_cell_center),
         cell('1 : 1', style_table_cell_center),
         cell('Cada pedido possui exatamente um pagamento associado; o pagamento pode ter múltiplas tentativas registradas como histórico')],
        [cell('Pedido — Avaliacao'), cell('Associação', style_table_cell_center),
         cell('1 : 0..1', style_table_cell_center),
         cell('Um pedido pode ou não receber avaliação; a avaliação é opcional e única por pedido')],
        [cell('Entregador — Pedido'), cell('Associação', style_table_cell_center),
         cell('1 : *', style_table_cell_center),
         cell('Um entregador realiza múltiplos pedidos ao longo do tempo; cada pedido é atribuído a um entregador por vez')],
        [cell('Pedido — Restaurante'), cell('Associação', style_table_cell_center),
         cell('* : 1', style_table_cell_center),
         cell('Múltiplos pedidos podem ser feitos no mesmo restaurante; cada pedido é de um único restaurante')],
        [cell('Cliente — Endereco'), cell('Agregação', style_table_cell_center),
         cell('1 : 1..*', style_table_cell_center),
         cell('Cliente agrega um ou mais endereços; endereços podem existir independentemente em catálogo de CEP')],
        [cell('Usuario ← Cliente'), cell('Herança', style_table_cell_center),
         cell('—is a—', style_table_cell_center),
         cell('Cliente é um tipo de Usuario; herda todos os atributos e métodos da superclasse abstrata')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(rel_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.15*AVAILABLE_WIDTH, 0.15*AVAILABLE_WIDTH, 0.45*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 4.2 — Relacionamentos entre classes do modelo", style_caption))

    # ═══════════════════════════════════════════════════════════════════════
    # 5. DIAGRAMA DE OBJETOS
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("5. Diagrama de Objetos", story, level=0)

    story.append(Paragraph(
        "Enquanto o diagrama de classes mostra a estrutura abstrata do modelo, o diagrama de "
        "objetos apresenta uma <b>fotografia</b> do sistema em um instante específico do tempo, "
        "com instâncias concretas das classes e valores reais de atributos. Este diagrama é "
        "particularmente útil para validar o modelo de classes, comunicar exemplos de uso "
        "reais e servir de base para testes de integração. A UML permite representar tanto "
        "objetos individuais quanto os <b>links</b> (instâncias de associações) entre eles.",
        style_body_justify))

    add_section_heading("5.1 Cenário Modelado", story, level=1)
    story.append(Paragraph(
        "O cenário escolhido retrata o momento em que a cliente <b>Maria Santos</b> realiza o "
        "pedido #1001 no restaurante <b>Burguer House</b>, pagando via PIX. O pedido contém "
        "2 unidades do X-Burger Especial (com observação 'sem cebola') e está em status "
        "'Em preparação'. O pagamento foi aprovado (transação PIX-20240325-889), e o "
        "entregador <b>João Pereira</b> já está designado para a entrega, aguardando o "
        "restaurante finalizar o preparo. Este snapshot permite validar todos os "
        "relacionamentos do diagrama de classes em um caso concreto.",
        style_body_justify))

    add_section_heading("5.2 Diagrama de Objetos", story, level=1)
    add_image(os.path.join(DIAGRAMS_DIR, "object.png"),
              max_width=AVAILABLE_WIDTH, max_height=PAGE_HEIGHT * 0.62,
              caption="Figura 5.1 — Diagrama de objetos: cenário do Pedido #1001", story=story)

    add_section_heading("5.3 Descrição das Instâncias", story, level=1)
    inst_data = [
        [cell('<b>Objeto</b>', style_table_header),
         cell('<b>Classe</b>', style_table_header),
         cell('<b>Estado</b>', style_table_header)],
        [cell('cliente1', style_table_cell_code), cell('Cliente', style_table_cell_center),
         cell('Maria Santos, email maria@gmail.com, telefone (11) 98765-4321, 2 endereços cadastrados')],
        [cell('restaurante1', style_table_cell_code), cell('Restaurante', style_table_cell_center),
         cell('Burguer House, CNPJ 12.345.678/0001-90, avaliação 4.8, tempo de entrega 30 min, aberto = true')],
        [cell('pedido1', style_table_cell_code), cell('Pedido', style_table_cell_center),
         cell('ID 1001, status "Em preparação", valor total R$ 89,90 (R$ 82,00 itens + R$ 7,90 frete), pago via PIX')],
        [cell('item1', style_table_cell_code), cell('ItemPedido', style_table_cell_center),
         cell('Quantidade 2, preço unitário R$ 25,90, subtotal R$ 51,80, observação "Sem cebola"')],
        [cell('produto1', style_table_cell_code), cell('Produto', style_table_cell_center),
         cell('X-Burger Especial, categoria Hambúrgueres, preço R$ 25,90, disponível = true')],
        [cell('pagamento1', style_table_cell_code), cell('Pagamento', style_table_cell_center),
         cell('Valor R$ 89,90, método PIX, status "Aprovado", transação PIX-20240325-889')],
        [cell('entregador1', style_table_cell_code), cell('Entregador', style_table_cell_center),
         cell('João Pereira, CNH 12345678900, veículo Moto Honda CG 160, disponível = true')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(inst_data, col_widths=[0.20*AVAILABLE_WIDTH, 0.18*AVAILABLE_WIDTH, 0.62*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 5.1 — Instâncias representadas no diagrama de objetos", style_caption))

    story.append(Paragraph(
        "Os <b>links</b> entre objetos (representados por setas no diagrama) materializam as "
        "associações definidas no diagrama de classes: cliente1 <i>fez</i> pedido1, pedido1 "
        "<i>contém</i> item1, item1 <i>referencia</i> produto1, pedido1 <i>pago com</i> "
        "pagamento1, pedido1 <i>atribuído a</i> entregador1, e restaurante1 <i>fornece</i> "
        "produto1. Cada link possui um rótulo descritivo que esclarece a semântica da relação, "
        "facilitando a leitura por stakeholders não técnicos.",
        style_body_justify))

    # ═══════════════════════════════════════════════════════════════════════
    # 6. DIAGRAMA DE PACOTES
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("6. Diagrama de Pacotes", story, level=0)

    story.append(Paragraph(
        "O diagrama de pacotes apresenta a <b>organização arquitetural</b> do sistema em "
        "camadas lógicas, agrupando classes e componentes relacionados em pacotes (namespaces "
        "ou módulos). É fundamental para visualizar dependências entre subsistemas e garantir "
        "que a arquitetura respeite princípios como Separação de Responsabilidades (SoC) e "
        "Baixo Acoplamento. A arquitetura aqui apresentada segue o padrão em camadas clássico, "
        "com separação clara entre apresentação, regras de negócio, persistência e integrações.",
        style_body_justify))

    add_section_heading("6.1 Visão Arquitetural", story, level=1)
    story.append(Paragraph(
        "A arquitetura proposta divide o sistema em <b>sete pacotes</b> com responsabilidades "
        "distintas. As dependências seguem o fluxo descendente: a camada de Apresentação "
        "depende de Negócio, que depende de Dados e Integrações. As camadas transversais "
        "(Segurança, Utilitários e Configuração) são consumidas por todas as demais. Esta "
        "estrutura facilita a manutenção, permite substituição de componentes (ex.: troca de "
        "PostgreSQL por MySQL sem afetar a camada de negócio) e suporta deploy independente "
        "em arquitetura de microsserviços.",
        style_body_justify))

    add_section_heading("6.2 Diagrama de Pacotes", story, level=1)
    add_image(os.path.join(DIAGRAMS_DIR, "package.png"),
              max_width=AVAILABLE_WIDTH, max_height=PAGE_HEIGHT * 0.55,
              caption="Figura 6.1 — Diagrama de pacotes do Sistema Food Delivery", story=story)

    add_section_heading("6.3 Descrição dos Pacotes", story, level=1)
    pkg_data = [
        [cell('<b>Pacote</b>', style_table_header),
         cell('<b>Camada</b>', style_table_header),
         cell('<b>Conteúdo e Responsabilidade</b>', style_table_header)],
        [cell('Apresentacao'), cell('Frontend', style_table_cell_center),
         cell('Apps móveis (Cliente iOS/Android, Entregador Android) e painéis web (Restaurante e Admin). Contém componentes de UI, controllers de tela, gerenciadores de estado e clientes HTTP')],
        [cell('Negocio'), cell('Backend Core', style_table_cell_center),
         cell('Serviços de domínio: PedidoService, PagamentoService, CupomService, EntregaService, AvaliacaoService. Implementa regras de negócio e orquestra chamadas entre Dados e Integrações')],
        [cell('Dados'), cell('Persistência', style_table_cell_center),
         cell('Repositórios (Repository Pattern), objetos DAO, cache Redis para consultas frequentes e conexão com banco PostgreSQL principal')],
        [cell('Integracoes'), cell('APIs Externas', style_table_cell_center),
         cell('Adapters para gateways de pagamento (Stripe, Mercado Pago), serviços de mapa (Google Maps, Mapbox), notificações push (Firebase FCM) e SMS (Twilio, TotalVoice)')],
        [cell('Seguranca'), cell('Cross-cutting', style_table_cell_center),
         cell('Autenticação JWT, criptografia AES-256, autorização RBAC (Role-Based Access Control) e auditoria de logs para conformidade LGPD')],
        [cell('Utilitarios'), cell('Cross-cutting', style_table_cell_center),
         cell('Helpers compartilhados: logging estruturado, validadores de CPF/CNPJ/CEP, conversores de DTO e formatadores de moeda/data')],
        [cell('Config'), cell('Infraestrutura', style_table_cell_center),
         cell('Gerenciamento de variáveis de ambiente, feature flags para deploy progressivo e configurações específicas por ambiente (dev/staging/prod)')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(pkg_data, col_widths=[0.18*AVAILABLE_WIDTH, 0.18*AVAILABLE_WIDTH, 0.64*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 6.1 — Descrição dos pacotes da arquitetura", style_caption))

    # ═══════════════════════════════════════════════════════════════════════
    # 7. DIAGRAMA DE SEQUÊNCIA
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("7. Diagrama de Sequência", story, level=0)

    story.append(Paragraph(
        "O diagrama de sequência captura a <b>visão dinâmica</b> do sistema, mostrando a "
        "ordem temporal das mensagens trocadas entre objetos durante a execução de um "
        "cenário específico. Diferente do diagrama de classes (estrutura estática) e do "
        "diagrama de objetos (snapshot), a sequência foca no <b>comportamento</b> ao longo "
        "do tempo. As mensagens podem ser síncronas (setas cheias) ou assíncronas (setas "
        "tracejadas), e cada lifeline (linha de vida) representa um participante ativo.",
        style_body_justify))

    add_section_heading("7.1 Cenário: Cliente Realiza Pedido com Sucesso", story, level=1)
    story.append(Paragraph(
        "O cenário modelado representa o fluxo feliz (happy path) completo de um pedido bem-"
        "sucedido. Cinco participantes interagem: o <b>Cliente</b> (usuário final), o "
        "<b>App Mobile</b> (frontend), o <b>Servidor</b> (backend), o <b>Restaurante</b> "
        "(painel do parceiro) e o <b>Gateway de Pagamento</b> (sistema externo). O fluxo "
        "inclui seleção de produtos, envio do pedido, validação de disponibilidade, "
        "processamento de pagamento, confirmação do restaurante e notificação ao cliente.",
        style_body_justify))

    add_section_heading("7.2 Diagrama de Sequência", story, level=1)
    add_image(os.path.join(DIAGRAMS_DIR, "sequence.png"),
              max_width=AVAILABLE_WIDTH, max_height=PAGE_HEIGHT * 0.55,
              caption="Figura 7.1 — Diagrama de sequência: fluxo de pedido com sucesso", story=story)

    add_section_heading("7.3 Descrição Passo-a-Passo do Fluxo", story, level=1)
    seq_data = [
        [cell('<b>Passo</b>', style_table_header),
         cell('<b>De → Para</b>', style_table_header),
         cell('<b>Mensagem</b>', style_table_header),
         cell('<b>Tipo</b>', style_table_header)],
        [cell('1', style_table_cell_center), cell('Cliente → App', style_table_cell_center),
         cell('selecionarProdutos() — Cliente navega e adiciona itens ao carrinho'),
         cell('Síncrona', style_table_cell_center)],
        [cell('2', style_table_cell_center), cell('App → Servidor', style_table_cell_center),
         cell('enviarPedido(dados) — App submete o carrinho para o backend'),
         cell('Síncrona', style_table_cell_center)],
        [cell('3', style_table_cell_center), cell('Servidor → Servidor', style_table_cell_center),
         cell('validarItens() — Servidor valida estrutura e regras de negócio internamente'),
         cell('Self-call', style_table_cell_center)],
        [cell('4', style_table_cell_center), cell('Servidor → Restaurante', style_table_cell_center),
         cell('verificarDisponibilidade() — Consulta painel do restaurante sobre itens'),
         cell('Síncrona', style_table_cell_center)],
        [cell('5', style_table_cell_center), cell('Restaurante → Servidor', style_table_cell_center),
         cell('itensDisponiveis = true — Retorno confirmando disponibilidade'),
         cell('Assíncrona', style_table_cell_center)],
        [cell('6', style_table_cell_center), cell('Servidor → Gateway', style_table_cell_center),
         cell('processarPagamento(valor, PIX) — Solicita transação ao gateway externo'),
         cell('Síncrona', style_table_cell_center)],
        [cell('7', style_table_cell_center), cell('Gateway → Servidor', style_table_cell_center),
         cell('pagamentoAprovado(transacaoId) — Confirmação da transação PIX'),
         cell('Assíncrona', style_table_cell_center)],
        [cell('8', style_table_cell_center), cell('Servidor → Restaurante', style_table_cell_center),
         cell('confirmarPedido(pedidoId) — Notifica restaurante para iniciar preparo'),
         cell('Síncrona', style_table_cell_center)],
        [cell('9', style_table_cell_center), cell('Restaurante → Servidor', style_table_cell_center),
         cell('pedidoAceito(status) — Restaurante confirma e inicia preparação'),
         cell('Assíncrona', style_table_cell_center)],
        [cell('10', style_table_cell_center), cell('Servidor → App', style_table_cell_center),
         cell('pedidoConfirmado(detalhes) — Backend retorna sucesso ao app mobile'),
         cell('Assíncrona', style_table_cell_center)],
        [cell('11', style_table_cell_center), cell('App → Cliente', style_table_cell_center),
         cell('exibirNotificacao(pedido) — App exibe confirmação e dispara push notification'),
         cell('Síncrona', style_table_cell_center)],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(seq_data, col_widths=[0.08*AVAILABLE_WIDTH, 0.22*AVAILABLE_WIDTH, 0.50*AVAILABLE_WIDTH, 0.20*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 7.1 — Detalhamento das mensagens do diagrama de sequência", style_caption))

    story.append(Paragraph(
        "<b>Fluxo alternativo (não representado no diagrama):</b> caso o pagamento seja "
        "recusado no passo 7, o Gateway retorna um erro em vez da confirmação. O Servidor "
        "então propaga o erro ao App, que oferece ao cliente a opção de tentar outro método "
        "de pagamento. O pedido permanece com status 'Aguardando Pagamento' e pode ser "
        "cancelado automaticamente após 10 minutos sem sucesso.",
        style_note))

    # ═══════════════════════════════════════════════════════════════════════
    # 8. EXEMPLO DE IMPLEMENTAÇÃO EM JAVA
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("8. Exemplo de Implementação em Java", story, level=0)

    story.append(Paragraph(
        "Esta seção apresenta um exemplo concreto de implementação em Java das classes "
        "<b>Pedido</b> e <b>Entregador</b>, demonstrando como os relacionamentos UML "
        "<<include>> e <<extend>> se traduzem em código executável. "
        "O exemplo é didático e não inclui todos os detalhes de uma implementação de produção "
        "(tratamento de exceções robusto, validações de bean, injeção de dependência), mas "
        "evidencia o mapeamento direto entre conceitos de modelagem e construções da "
        "linguagem.",
        style_body_justify))

    add_section_heading("8.1 Classe Pedido", story, level=1)
    story.append(Paragraph(
        "A classe <b>Pedido</b> encapsula o comportamento de um pedido, incluindo o método "
        "<code>fazerPedido()</code> que orquestra os casos de uso inclusos e estendidos. "
        "Note como os <i>includes</i> são chamadas obrigatórias (métodos privados chamados "
        "sempre), enquanto os <i>extends</i> são condicionais (chamados dentro de <code>if</code>).",
        style_body_justify))

    pedido_code = '''public class Pedido {
    private int id;
    private DateTime dataHora;
    private String status;
    private double valorTotal;
    private double valorFrete;
    private String formaPagamento;
    private String enderecoEntrega;
    int tempoEstimado;  // visibilidade package (~)

    private List<ItemPedido> itens;
    private Pagamento pagamento;
    private Cliente cliente;
    private Restaurante restaurante;
    private Entregador entregador;

    public void fazerPedido() {
        // Include: VerificarDisponibilidade (obrigatório)
        verificarDisponibilidade();

        // Include: RealizarPagamento (obrigatório)
        realizarPagamento();

        // Extend: AplicarCupomDesconto (opcional, condicional)
        if (temCupom()) {
            aplicarCupom();
        }

        // Extend: AgendarEntrega (opcional, condicional)
        if (entregaAgendada()) {
            agendarEntrega();
        }
    }

    public void rastrearPedido() {
        // Include: ConsultarLocalizacao (obrigatório)
        Localizacao loc = consultarLocalizacao();
        exibirNoMapa(loc);
    }

    public void cancelarPedido() {
        if (status.equals("Em preparação")) {
            // Include: SolicitarReembolso (obrigatório)
            pagamento.estornar();
            status = "Cancelado";
        }
    }

    private void verificarDisponibilidade() {
        for (ItemPedido item : itens) {
            if (!item.getProduto().isDisponivel()) {
                throw new RuntimeException("Produto indisponível: "
                    + item.getProduto().getNome());
            }
        }
    }
}'''
    story.append(code_block(pedido_code))

    add_section_heading("8.2 Classe Entregador", story, level=1)
    story.append(Paragraph(
        "A classe <b>Entregador</b> herda de <b>Usuario</b> (herança) e implementa o "
        "comportamento de aceitar entregas e atualizar status. Observe como o método "
        "<code>atualizarStatus()</code> incorpora um <i>extend</i> (Reportar Problema, "
        "condicional) e um <i>include</i> (Confirmar Entrega, obrigatório em determinado "
        "estado).",
        style_body_justify))

    entregador_code = '''public class Entregador extends Usuario {  // Herança
    private String cnh;
    private String veiculo;
    private boolean disponivel;

    public void aceitarEntrega(Pedido pedido) {
        if (disponivel) {
            // Include: VerificarRota (obrigatório)
            Rota rota = verificarRota(pedido.getEnderecoEntrega());
            if (rota.isViavel()) {
                pedido.setEntregador(this);
                pedido.atualizarStatus("Saiu para entrega");
                disponivel = false;
            }
        }
    }

    public void atualizarStatus(Pedido pedido, String novoStatus) {
        pedido.setStatus(novoStatus);

        // Extend: ReportarProblema (opcional, condicional)
        if (novoStatus.equals("Problema")) {
            reportarProblema(pedido);
        }

        // Include: ConfirmarEntrega (obrigatório ao concluir)
        if (novoStatus.equals("Entregue")) {
            confirmarEntrega(pedido);
            disponivel = true;
        }
    }

    private Rota verificarRota(String endereco) {
        // Integração com serviço de mapas (Google Maps API)
        return mapaService.calcularRota(endereco);
    }
}'''
    story.append(code_block(entregador_code))

    add_section_heading("8.3 Mapeamento UML → Código", story, level=1)
    story.append(Paragraph(
        "A tabela abaixo sintetiza como cada conceito UML se manifesta no código Java. "
        "Este mapeamento ajuda desenvolvedores a traduzir diagramas em implementações "
        "consistentes e ajuda arquitetos a revisar se o código respeita o modelo.",
        style_body_justify))

    map_data = [
        [cell('<b>Conceito UML</b>', style_table_header),
         cell('<b>Construção Java</b>', style_table_header),
         cell('<b>Exemplo no Código</b>', style_table_header)],
        [cell('Herança'), cell('extends', style_table_cell_code),
         cell('public class Entregador extends Usuario')],
        [cell('Associação'), cell('Atributo + getter/setter', style_table_cell_code),
         cell('private Cliente cliente; // em Pedido')],
        [cell('Composição'), cell('Atributo + criação no construtor', style_table_cell_code),
         cell('private List<ItemPedido> itens = new ArrayList<>();')],
        [cell('Agregação'), cell('Atributo sem posse de ciclo de vida', style_table_cell_code),
         cell('private Restaurante restaurante; // em Pedido')],
        [cell('<<include>>'), cell('Chamada de método obrigatória', style_table_cell_code),
         cell('verificarDisponibilidade(); // sempre chamado')],
        [cell('<<extend>>'), cell('Chamada condicional (if)', style_table_cell_code),
         cell('if (temCupom()) { aplicarCupom(); }')],
        [cell('Visibilidade -'), cell('private', style_table_cell_code),
         cell('private int id;')],
        [cell('Visibilidade #'), cell('protected', style_table_cell_code),
         cell('protected String tipoUsuario; // em Usuario')],
        [cell('Visibilidade +'), cell('public', style_table_cell_code),
         cell('public void fazerPedido()')],
        [cell('Visibilidade ~'), cell('package-private', style_table_cell_code),
         cell('int tempoEstimado; // sem modificador')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(map_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.30*AVAILABLE_WIDTH, 0.45*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 8.1 — Mapeamento de conceitos UML para construções Java", style_caption))

    # ═══════════════════════════════════════════════════════════════════════
    # 9. TABELA RESUMO DE RELAÇÕES UML
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("9. Tabela Resumo de Relações UML", story, level=0)

    story.append(Paragraph(
        "A UML define oito tipos principais de relacionamentos que podem ocorrer entre "
        "elementos de um modelo. Compreender as diferenças entre cada um é essencial para "
        "produzir diagramas corretos e não ambíguos. A tabela a seguir apresenta cada "
        "relação com seu símbolo, um exemplo concreto do sistema de delivery e a justificativa "
        "para a escolha daquele tipo específico.",
        style_body_justify))

    rel_summary_data = [
        [cell('<b>Relação</b>', style_table_header),
         cell('<b>Símbolo</b>', style_table_header),
         cell('<b>Exemplo no Food Delivery</b>', style_table_header),
         cell('<b>Justificativa</b>', style_table_header)],
        [cell('Associação'), cell('———', style_table_cell_center),
         cell('Cliente → Pedido'),
         cell('Cliente conhece seus pedidos; relação estrutural entre objetos independentes')],
        [cell('Herança'), cell('———▷', style_table_cell_center),
         cell('Cliente → Usuario'),
         cell('Cliente é um tipo de Usuario; herda atributos e comportamentos da superclasse')],
        [cell('Dependência'), cell('——→', style_table_cell_center),
         cell('Controller → Service'),
         cell('Controller depende do Service em tempo de execução, mas não o possui como atributo')],
        [cell('Agregação'), cell('◇———', style_table_cell_center),
         cell('Restaurante ◇——— Produto'),
         cell('Restaurante agrega produtos, mas produtos poderiam existir independentemente em catálogo genérico')],
        [cell('Composição'), cell('◆———', style_table_cell_center),
         cell('Pedido ◆——— ItemPedido'),
         cell('ItemPedido não existe sem Pedido; ciclo de vida totalmente dependente (deleta em cascata)')],
        [cell('Include'), cell('<<include>>', style_table_cell_center),
         cell('Fazer Pedido → Realizar Pagamento'),
         cell('Pagamento é obrigatório e sempre executado quando um pedido é feito')],
        [cell('Extend'), cell('<<extend>>', style_table_cell_center),
         cell('Fazer Pedido → Aplicar Cupom'),
         cell('Cupom é opcional, aplicado apenas sob condição (cliente possui cupom válido)')],
        [cell('Realização'), cell('- - -▷', style_table_cell_center),
         cell('Pagamento implements IPagamento'),
         cell('Pagamento implementa o contrato definido pela interface IPagamento')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(rel_summary_data, col_widths=[0.15*AVAILABLE_WIDTH, 0.15*AVAILABLE_WIDTH, 0.30*AVAILABLE_WIDTH, 0.40*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 9.1 — Resumo dos relacionamentos UML aplicados ao sistema", style_caption))

    story.append(Paragraph(
        "A distinção mais sutil — e frequentemente fonte de erros em modelagem — é entre "
        "<b>agregação</b> e <b>composição</b>. Ambas representam relacionamentos todo-parte, "
        "mas a composição implica em posse exclusiva do ciclo de vida: se o todo é destruído, "
        "as partes também são. Na agregação, as partes podem sobreviver ao todo. No sistema "
        "de delivery, ItemPedido é composição de Pedido (não faz sentido existir um item "
        "sem pedido), enquanto Produto é agregação de Restaurante (um produto poderia ser "
        "transferido para outro restaurante ou existir em catálogo compartilhado).",
        style_body_justify))

    # ═══════════════════════════════════════════════════════════════════════
    # 10. DIFERENCIAIS DO SISTEMA
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("10. Diferenciais do Sistema", story, level=0)

    story.append(Paragraph(
        "Além das funcionalidades core modeladas nos diagramas anteriores, o sistema possui "
        "diferenciais importantes que o destacam em um mercado competitivo. Esta seção "
        "resume as funcionalidades por canal (mobile e web admin) e as integrações com "
        "serviços externos essenciais para a operação.",
        style_body_justify))

    add_section_heading("10.1 Funcionalidades Mobile (Android/iOS)", story, level=1)
    mobile_data = [
        [cell('<b>App</b>', style_table_header),
         cell('<b>Plataforma</b>', style_table_header),
         cell('<b>Funcionalidades-Chave</b>', style_table_header)],
        [cell('App do Cliente'), cell('iOS + Android', style_table_cell_center),
         cell('Busca e filtro de restaurantes, carrinho de compras, checkout multi-método, rastreamento em tempo real, avaliações, histórico, chat com entregador, gestão de endereços e cupons')],
        [cell('App do Entregador'), cell('Android', style_table_cell_center),
         cell('Recebimento de notificações de entrega, aceitação/recusa, navegação GPS integrada, atualização de status, registro de problemas, controle de disponibilidade e ganhos')],
        [cell('App do Restaurante'), cell('iOS + Android + Web', style_table_cell_center),
         cell('Gestão de pedidos em tempo real, aceitação/rejeição, atualização de cardápio, controle de disponibilidade de produtos, métricas de vendas e promoções')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(mobile_data, col_widths=[0.22*AVAILABLE_WIDTH, 0.22*AVAILABLE_WIDTH, 0.56*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 10.1 — Funcionalidades dos aplicativos móveis", style_caption))

    add_section_heading("10.2 Funcionalidades Web Admin", story, level=1)
    web_data = [
        [cell('<b>Módulo</b>', style_table_header),
         cell('<b>Funcionalidades</b>', style_table_header)],
        [cell('Dashboard'), cell('Métricas em tempo real: GMV (Gross Merchandise Volume), ticket médio, número de pedidos por hora, restaurantes ativos, NPS e taxa de cancelamento')],
        [cell('Gestão de Usuários'), cell('Bloqueio e desbloqueio de clientes/entregadores, verificação de documentos (CPF, CNH, antecedentes), gestão de roles e permissões')],
        [cell('Gestão de Restaurantes'), cell('Aprovação de novos cadastros, gestão de comissões, suporte a disputes, suspensão temporária e encerramento de parcerias')],
        [cell('Gestão Financeira'), cell('Comissões por pedido, repasses aos restaurantes, conciliação bancária, relatórios fiscais e exportação para sistemas contábeis')],
        [cell('Marketing'), cell('Criação de campanhas segmentadas, cupons de desconto com regras (primeira compra, recorrente, frete grátis), push notifications em massa e relatórios de conversão')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(web_data, col_widths=[0.25*AVAILABLE_WIDTH, 0.75*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 10.2 — Funcionalidades do painel administrativo web", style_caption))

    add_section_heading("10.3 Integrações com Serviços Externos", story, level=1)
    story.append(Paragraph(
        "A operação de um sistema de delivery depende criticamente de integrações com "
        "terceiros para pagamentos, mapas, notificações e comunicação. A escolha de "
        "fornecedores consolidados reduz risco operacional e acelera o time-to-market. "
        "A arquitetura deve isolar essas integrações por trás de interfaces (Adapter "
        "Pattern) para facilitar trocas futuras.",
        style_body_justify))

    integ_data = [
        [cell('<b>Categoria</b>', style_table_header),
         cell('<b>Fornecedores</b>', style_table_header),
         cell('<b>Caso de Uso</b>', style_table_header)],
        [cell('Pagamentos'), cell('Stripe, Mercado Pago, PayPal', style_table_cell_center),
         cell('Processamento de cartão de crédito, PIX, carteira digital; split de pagamento entre plataforma e restaurante')],
        [cell('Mapas'), cell('Google Maps, Mapbox', style_table_cell_center),
         cell('Geocodificação de endereços, cálculo de rotas, estimativa de tempo de entrega, exibição de mapa em tempo real')],
        [cell('Notificações'), cell('Firebase Cloud Messaging (FCM)', style_table_cell_center),
         cell('Push notifications para apps mobile (status de pedido, promoções, alertas de entrega)')],
        [cell('SMS'), cell('Twilio, TotalVoice', style_table_cell_center),
         cell('SMS de confirmação de pedido, códigos de verificação por telefone, alertas críticos de falha')],
        [cell('Storage'), cell('AWS S3, Cloudflare R2', style_table_cell_center),
         cell('Armazenamento de fotos de produtos, avatares de usuários, documentos de validação (CNH, comprovante)'),
         ],
        [cell('Observabilidade'), cell('Datadog, Sentry, New Relic', style_table_cell_center),
         cell('Monitoramento de performance, erros em produção, tracing distribuído e alertas em tempo real')],
    ]
    story.append(Spacer(1, 6))
    story.append(build_table(integ_data, col_widths=[0.18*AVAILABLE_WIDTH, 0.30*AVAILABLE_WIDTH, 0.52*AVAILABLE_WIDTH]))
    story.append(Paragraph("Tabela 10.3 — Integrações com serviços externos", style_caption))

    # ═══════════════════════════════════════════════════════════════════════
    # 11. CONSIDERAÇÕES FINAIS
    # ═══════════════════════════════════════════════════════════════════════
    add_section_heading("11. Considerações Finais", story, level=0)

    story.append(Paragraph(
        "Este documento apresentou um projeto completo de modelagem UML para um sistema de "
        "delivery de comida, cobrindo desde o levantamento de requisitos até exemplos de "
        "implementação. A modelagem formal — muitas vezes subestimada em favor de "
        "abordagens ágeis puras — demonstra seu valor em sistemas de complexidade média a "
        "alta como o food delivery, onde múltiplos atores, transações financeiras, "
        "geolocalização em tempo real e regras de negócio intricadas precisam coexistir "
        "sem ambiguidades.",
        style_body_justify))

    story.append(Paragraph(
        "Os artefatos produzidos (15 requisitos funcionais, 12 não funcionais, diagramas "
        "de casos de uso, classes, objetos, pacotes e sequência) formam um conjunto "
        "coeso que pode ser apresentado a diferentes stakeholders: investidores "
        "(casos de uso e requisitos), desenvolvedores (classes e sequência), arquitetos "
        "(pacotes) e QA (descrições textuais de casos de uso com fluxos alternativos). "
        "Esta versatilidade é uma das principais vantagens da UML quando bem aplicada.",
        style_body_justify))

    story.append(Paragraph(
        "Como próximos passos do projeto, recomenda-se: (i) <b>detalhamento de diagramas "
        "complementares</b> — diagrama de atividades para fluxos complexos como "
        "cancelamento, diagrama de máquina de estados para o ciclo de vida do Pedido, e "
        "diagrama de componentes para visão de deploy; (ii) <b>prototipação de baixa "
        "fidelidade</b> das telas principais (busca, carrinho, rastreamento) para validação "
        "com usuários antes da implementação; (iii) <b>definição da API REST</b> com "
        "OpenAPI/Swagger derivada do modelo de classes; (iv) <b>planejamento de testes</b> "
        "baseado nas descrições de casos de uso, mapeando cada fluxo principal e "
        "alternativo para casos de teste automatizados; e (v) <b>setup de infraestrutura</b> "
        "com CI/CD, ambientes (dev/staging/prod) e monitoramento desde o primeiro sprint.",
        style_body_justify))

    story.append(Paragraph(
        "A lição central deste projeto é que <b>modelagem e implementação não são etapas "
        "concorrentes, mas complementares</b>. A UML não substitui código — ela reduz o "
        "desperdício de retrabalho, alinha expectativas e preserva o conhecimento do "
        "domínio ao longo do ciclo de vida do software. Em uma startup em crescimento "
        "com 500+ restaurantes, onde a equipe tende a dobrar a cada semestre, este tipo "
        "de documentação é o que permite que novos desenvolvedores sejam produtivos em "
        "semanas e não em meses.",
        style_body_justify))

    return story


# ─────────────────────────────────────────────────────────────────────────────
# BUILD DOCUMENT
# ─────────────────────────────────────────────────────────────────────────────

def main():
    print(f"Building body PDF → {OUTPUT_PATH}")
    doc = TocDocTemplate(
        OUTPUT_PATH,
        pagesize=A4,
        leftMargin=LEFT_MARGIN,
        rightMargin=RIGHT_MARGIN,
        topMargin=TOP_MARGIN,
        bottomMargin=BOTTOM_MARGIN,
        title="Projeto de Modelagem UML - Food Delivery System",
        author="Z.ai",
        creator="Z.ai",
        subject="Documentação técnica de modelagem UML para sistema de delivery de comida",
    )
    story = build_story()
    doc.multiBuild(story, onFirstPage=on_page, onLaterPages=on_page)
    print(f"✓ Body PDF generated: {OUTPUT_PATH}")
    # Report file size
    size_kb = os.path.getsize(OUTPUT_PATH) / 1024
    print(f"  Size: {size_kb:.1f} KB")


if __name__ == "__main__":
    main()
