# Protocolo de validação

Este protocolo registra como medir o comportamento do OCR e dos modelos sem afirmar uma taxa de acerto antes de executar e revisar os casos.

## Correção e classificação

O conjunto atual em data/questions.py contém 30 casos anotados: cinco para cada um dos seis tópicos do sistema, com 15 respostas esperadas como corretas e 15 como incorretas. Execute a avaliação a partir da raiz do repositório:

    python -m app.main

Para conferir se o modelo local e o ambiente estão respondendo, execute apenas os primeiros casos:

    python -m app.main --limit 2

Para guardar um relatório reproduzível em JSON:

    python -m app.main --output /tmp/avaliacao-llm.json

O relatório registra o modelo configurado, data, casos concluídos/falhos, acurácia de classificação, acurácia de tópico, matriz de confusão e latência média, mediana e p95. O nome do modelo vem da configuração ANALYSIS_MODEL.

Os 30 exemplos são um conjunto pequeno de cenários de referência escritos para cobrir os tópicos; não representam uma amostra estatística de estudantes reais. Ao apresentar os percentuais, informe o tamanho do conjunto e mantenha os erros encontrados junto dos resultados.

### Resultado já observado pelo autor

O autor informou uma execução de 30 chamadas com 30/30 acertos (100%) na classificação de corretude e 30/30 acertos (100%) na identificação do tópico. Este registro documenta o resultado já obtido; não foi gerado novamente durante esta revisão. Como os casos são poucos e curados, apresente-o como resultado exploratório do conjunto de referência, não como garantia de desempenho em provas ou populações diferentes. Para tornar a medição plenamente reproduzível, salve o relatório JSON da próxima execução junto com o nome/versão do modelo e as condições da máquina.

## Transcrição e separação de questões

Para cada imagem ou documento avaliado, prepare uma transcrição de referência revisada por uma pessoa e anote o resultado produzido pelo sistema no CSV modelo em data/evaluation/ocr-results-template.csv. Uma linha representa uma amostra. Use engine como qwen3-vl ou tesseract e kind como manuscrito, impresso, prova-completa ou outro rótulo consistente.

Execute o cálculo depois de preencher uma cópia do CSV:

    python scripts/evaluate_ocr.py caminho/para/ocr-resultados.csv

O avaliador pode também salvar JSON:

    python scripts/evaluate_ocr.py caminho/para/ocr-resultados.csv --output /tmp/avaliacao-ocr.json

Métricas:

- **CER:** distância de edição por caractere dividida pelo total de caracteres de referência. Símbolos e caixa são preservados; sequências de espaços são normalizadas.
- **WER:** distância de edição por palavra dividida pelo número de palavras de referência.
- **Acurácia de quantidade de questões:** proporção de documentos em que a quantidade identificada coincide com a referência, quando os dois valores foram preenchidos.
- **Latência:** média, mediana e p95 dos tempos informados em segundos.

Separe os resultados por tipo de escrita/documento e por motor. Não compare tempos de máquinas diferentes sem registrar o hardware, o estado do modelo (aquecido ou recém-carregado), a resolução e o número de páginas.

## Procedimento recomendado para a apresentação

1. Congele a versão do código, os nomes dos modelos e os casos anotados usados na medição.
2. Faça uma execução de aquecimento e depois registre a execução medida; identifique as duas condições.
3. Revise a transcrição de referência e as saídas de OCR sem usar a resposta esperada para alterar o resultado do modelo.
4. Mostre acertos e erros. Não exclua casos difíceis depois de ver o resultado.
5. Informe limites do conjunto: quantidade, origem, tipos de escrita e o fato de ser uma avaliação exploratória.
6. Só inclua dados de pessoas reais com autorização apropriada e remova identificadores antes de compartilhar relatórios ou anexos.
