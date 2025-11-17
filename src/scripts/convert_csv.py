#!/usr/bin/env python3
"""
Script para converter estatísticas de feedback (JSON) para CSV.
Recebe dados JSON via stdin ou arquivo e exporta como CSV.

Uso:
    # Via stdin (pipe)
    echo '{"totalFeedbacks": 10, ...}' | python convert_csv.py
    
    # Via arquivo
    python convert_csv.py < dados.json
    
    # Chamado pelo backend Node.js
    node -e "console.log(JSON.stringify(stats))" | python convert_csv.py
"""

import json
import csv
import sys
from typing import Dict, Any


def read_json_input() -> Dict[str, Any]:
    """
    Lê dados JSON de stdin ou arquivo.
    
    Returns:
        Dicionário com as estatísticas
    """
    try:
        # Tenta ler de stdin
        if not sys.stdin.isatty():
            data = sys.stdin.read()
            return json.loads(data)
        
        # Se não houver stdin, tenta ler de arquivo passado como argumento
        if len(sys.argv) > 1:
            with open(sys.argv[1], 'r', encoding='utf-8') as f:
                return json.load(f)
        
        # Se não houver nenhum input, retorna erro
        print('Erro: Nenhum dado JSON fornecido.', file=sys.stderr)
        print('Uso: python convert_csv.py [arquivo.json]', file=sys.stderr)
        print('Ou: echo \'{"dados": "json"}\' | python convert_csv.py', file=sys.stderr)
        sys.exit(1)
        
    except json.JSONDecodeError as e:
        print(f'Erro ao decodificar JSON: {e}', file=sys.stderr)
        sys.exit(1)
    except FileNotFoundError:
        print(f'Erro: Arquivo não encontrado: {sys.argv[1]}', file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f'Erro ao ler dados: {e}', file=sys.stderr)
        sys.exit(1)


def flatten_stats(stats: Dict[str, Any]) -> Dict[str, Any]:
    """
    Converte estrutura aninhada em estrutura plana para CSV.
    
    Args:
        stats: Dicionário com estatísticas aninhadas
        
    Returns:
        Dicionário com estrutura plana
    """
    flattened = {
        'totalFeedbacks': stats.get('totalFeedbacks', 0),
        'nps': round(stats.get('nps', 0), 2),
    }
    
    # Adicionar dados de byVinculo
    by_vinculo = stats.get('byVinculo', {})
    flattened['byVinculo_aluno'] = by_vinculo.get('aluno', 0)
    flattened['byVinculo_visitante'] = by_vinculo.get('visitante', 0)
    flattened['byVinculo_funcionario'] = by_vinculo.get('funcionario', 0)
    
    # Adicionar dados de byAnonymous
    by_anonymous = stats.get('byAnonymous', {})
    flattened['byAnonymous_anonymous'] = by_anonymous.get('anonymous', 0)
    flattened['byAnonymous_identified'] = by_anonymous.get('identified', 0)
    
    # Adicionar médias de avaliações
    average_scores = stats.get('averageScores', {})
    for key, value in average_scores.items():
        flattened[f'averageScores_{key}'] = round(value, 2) if value else 0
    
    return flattened


def export_to_csv(data: Dict[str, Any], output_stream=sys.stdout):
    """
    Exporta dados para CSV na saída padrão.
    
    Args:
        data: Dicionário com dados planos
        output_stream: Stream de saída (padrão: stdout)
    """
    # Mapeamento entre campos gerados e nomes amigáveis para o CSV
    field_mapping = {
        'totalFeedbacks': 'Total Feedbacks',
        'nps': 'NPS',
        'byVinculo_aluno': 'Alunos',
        'byVinculo_visitante': 'Visitantes',
        'byVinculo_funcionario': 'Funcionários',
        'byAnonymous_anonymous': 'Anônimos',
        'byAnonymous_identified': 'Identificados',
        'averageScores_identificarLocalizacao': 'Identificar Localização',
        'averageScores_instrucoesClaras': 'Instruções Claras',
        'averageScores_representacaoFiel': 'Representação Fiel',
        'averageScores_trajetoFacilSeguir': 'Trajeto Fácil',
        'averageScores_facilUsar': 'Fácil Usar',
        'averageScores_designClaro': 'Design Claro',
        'averageScores_interacaoSemDificuldade': 'Interação',
        'averageScores_tempoRazoavel': 'Tempo Razoável',
        'averageScores_confiancaDestino': 'Confiança',
        'averageScores_recomendaria': 'Recomendaria',
        'averageScores_voltariaUsar': 'Voltaria Usar',
        'averageScores_satisfacaoGeral': 'Satisfação Geral',
    }
    
    # Ordem dos campos (usando os nomes amigáveis como headers)
    fieldnames = list(field_mapping.values())
    
    # Criar dicionário com nomes amigáveis mapeados dos dados originais
    csv_data = {}
    for original_field, friendly_name in field_mapping.items():
        csv_data[friendly_name] = data.get(original_field, 0)
    
    writer = csv.DictWriter(output_stream, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerow(csv_data)


def main():
    """Função principal."""
    # Ler dados JSON
    stats = read_json_input()
    
    # Converter para estrutura plana
    flattened_data = flatten_stats(stats)
    
    # Exportar para CSV na stdout (para o backend poder retornar diretamente)
    export_to_csv(flattened_data)


if __name__ == '__main__':
    main()
