#!/usr/bin/env python3
"""
Script para extrair informações de provas de um PDF com tabelas de disciplinas.
Extrai: título (turno + dia + data), horário, período, código e nome da disciplina.
"""

import sys
import json
import re
from io import BytesIO

try:
    import pdfplumber
except ImportError:
    print(json.dumps({"error": "pdfplumber não está instalado. Execute: pip install pdfplumber"}, ensure_ascii=False), file=sys.stderr)
    sys.exit(1)


def extract_period(text):
    """Extrai o período de um texto como '1º', '2º', '3°/4°', etc."""
    if not text:
        return None
    
    # Remove espaços e converte para string
    text = str(text).strip()
    
    # Procura por padrões como "1º", "2º", "3°/4°", "5°/6°"
    # Pega o primeiro período encontrado
    match = re.search(r'(\d+)', text)
    if match:
        return int(match.group(1))
    return None


def parse_time_range(time_str):
    """Converte horário de '19h às 20h' para formato padronizado."""
    if not time_str:
        return None
    
    time_str = str(time_str).strip()
    # Remove espaços extras e padroniza
    time_str = re.sub(r'\s+', ' ', time_str)
    return time_str


def extract_date_from_title(title):
    """Extrai a data do título, ex: 'Terça-Feira (16/09/2025)'"""
    match = re.search(r'\((\d{2}/\d{2}/\d{4})\)', title)
    if match:
        return match.group(1)
    return None


def extract_shift_from_title(title):
    """Extrai o turno do título: 'NOTURNO' ou 'MATUTINO'"""
    title_upper = title.upper()
    if 'NOTURNO' in title_upper:
        return 'noturno'
    elif 'MATUTINO' in title_upper:
        return 'matutino'
    return None


def extract_day_from_title(title):
    """Extrai o dia da semana do título"""
    days_map = {
        'TERÇA-FEIRA': 'Terça-Feira',
        'QUARTA-FEIRA': 'Quarta-Feira',
        'QUINTA-FEIRA': 'Quinta-Feira',
        'SEGUNDA-FEIRA': 'Segunda-Feira',
        'SEXTA-FEIRA': 'Sexta-Feira'
    }
    
    for key, value in days_map.items():
        if key in title.upper():
            return value
    return None


def parse_pdf_exams(pdf_bytes):
    """Processa o PDF e extrai informações das provas."""
    exams = []
    
    try:
        pdf_file = BytesIO(pdf_bytes)
        
        with pdfplumber.open(pdf_file) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # Extrai tabelas da página
                tables = page.extract_tables()
                
                if not tables:
                    continue
                
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                    
                    # Procura pelo cabeçalho da tabela com "DISCIPLINAS"
                    header_row_idx = None
                    title = ""
                    
                    for idx, row in enumerate(table):
                        if not row:
                            continue
                        row_text = ' '.join([str(cell) if cell else '' for cell in row]).upper()
                        if 'DISCIPLINAS' in row_text and ('NOTURNO' in row_text or 'MATUTINO' in row_text):
                            # Constrói o título completo
                            title_parts = []
                            for cell in row:
                                if cell:
                                    title_parts.append(str(cell).strip())
                            title = ' '.join(title_parts)
                            header_row_idx = idx
                            break
                    
                    if not header_row_idx:
                        continue
                    
                    # Extrai informações do título
                    shift = extract_shift_from_title(title)
                    day = extract_day_from_title(title)
                    date = extract_date_from_title(title)
                    
                    # Procura pelo cabeçalho das colunas (normalmente após o título)
                    # Estrutura esperada: [Disciplina] [Período] [Horário Aplicação]
                    column_header_idx = None
                    for idx in range(header_row_idx + 1, min(header_row_idx + 3, len(table))):
                        row = table[idx]
                        if not row:
                            continue
                        row_text = ' '.join([str(cell) if cell else '' for cell in row]).upper()
                        if 'PERÍODO' in row_text or 'PERIODO' in row_text or 'HORÁRIO' in row_text or 'HORARIO' in row_text:
                            column_header_idx = idx
                            break
                    
                    # Se não encontrou cabeçalho de colunas, assume que começa logo após o título
                    if column_header_idx is None:
                        column_header_idx = header_row_idx + 1
                    
                    # Processa as linhas de dados
                    current_time = None
                    
                    for row_idx in range(column_header_idx + 1, len(table)):
                        row = table[row_idx]
                        if not row:
                            continue
                        
                        # Limpa células None e vazias
                        row = [str(cell).strip() if cell else '' for cell in row]
                        
                        # Remove células completamente vazias do início
                        while row and not row[0]:
                            row.pop(0)
                        
                        if not row or len(row) < 2:
                            continue
                        
                        # Verifica se é uma linha de horário (geralmente na primeira coluna)
                        first_cell = row[0] if row else ''
                        
                        # Padrão de horário: "19h às 20h" ou "08h às 09h"
                        time_pattern = r'(\d{1,2})h\s*(?:às|-)\s*(\d{1,2})h'
                        time_match = re.search(time_pattern, first_cell, re.IGNORECASE)
                        
                        if time_match:
                            # É uma linha de horário
                            hour1 = time_match.group(1)
                            hour2 = time_match.group(2)
                            current_time = f"{hour1}h às {hour2}h"
                            continue
                        
                        # Procura horário em qualquer coluna da linha
                        found_time_in_row = None
                        for cell in row:
                            time_match = re.search(time_pattern, cell, re.IGNORECASE)
                            if time_match:
                                hour1 = time_match.group(1)
                                hour2 = time_match.group(2)
                                found_time_in_row = f"{hour1}h às {hour2}h"
                                break
                        
                        if found_time_in_row:
                            current_time = found_time_in_row
                        
                        # Se não temos horário, pula esta linha
                        if not current_time:
                            continue
                        
                        # Extrai código e nome da disciplina
                        discipline_cell = None
                        period_cell = None
                        
                        # Procura pela célula com código numérico de 5+ dígitos seguido de texto
                        # Exemplo: "14275 - ARQUITETURA E ORGANIZAÇÃO DE COMPUTADORES"
                        for cell in row:
                            cell_str = str(cell).strip()
                            # Padrão: número de 5+ dígitos seguido de espaço e texto
                            if re.match(r'^\d{5,}\s+[-–]\s*.+', cell_str) or re.match(r'^\d{5,}\s+.+', cell_str):
                                discipline_cell = cell_str
                                break
                        
                        # Se não encontrou padrão completo, procura por código numérico
                        if not discipline_cell:
                            for cell in row:
                                cell_str = str(cell).strip()
                                if re.match(r'^\d{5,}', cell_str):
                                    discipline_cell = cell_str
                                    break
                        
                        # Se ainda não encontrou, usa a primeira célula não vazia que não seja horário
                        if not discipline_cell:
                            for cell in row:
                                cell_str = str(cell).strip()
                                if cell_str and not re.search(time_pattern, cell_str, re.IGNORECASE):
                                    discipline_cell = cell_str
                                    break
                        
                        # Procura pelo período (padrão: "1º", "2º", "3°/4°", etc.)
                        for cell in row:
                            cell_str = str(cell).strip()
                            period = extract_period(cell_str)
                            if period:
                                period_cell = period
                                break
                        
                        # Se encontrou disciplina válida (tem código numérico ou texto significativo)
                        if discipline_cell and (re.search(r'\d{5,}', discipline_cell) or len(discipline_cell) > 10):
                            exam = {
                                "day": day or "",
                                "date": date or "",
                                "subject": discipline_cell,
                                "time": current_time or "",
                                "grade": None,
                                "cycle": period_cell or 1,
                                "shift": shift or ""
                            }
                            exams.append(exam)
        
        return exams
        
    except Exception as e:
        import traceback
        return {"error": f"Erro ao processar PDF: {str(e)}\n{traceback.format_exc()}"}


def main():
    """Função principal que lê PDF do stdin e retorna JSON no stdout."""
    try:
        # Lê o PDF do stdin (bytes)
        pdf_bytes = sys.stdin.buffer.read()
        
        if not pdf_bytes:
            print(json.dumps({"error": "Nenhum dado recebido"}, ensure_ascii=False), file=sys.stderr)
            sys.exit(1)
        
        # Processa o PDF
        result = parse_pdf_exams(pdf_bytes)
        
        if isinstance(result, dict) and "error" in result:
            print(json.dumps(result, ensure_ascii=False), file=sys.stderr)
            sys.exit(1)
        
        # Retorna JSON no stdout
        print(json.dumps({"exams": result}, ensure_ascii=False))
        
    except Exception as e:
        error_msg = {"error": f"Erro inesperado: {str(e)}"}
        print(json.dumps(error_msg, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

