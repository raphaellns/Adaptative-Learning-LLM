questions = [
    {
        "id": 1,
        "topic": "Vetores",
        "question": """
        Implemente uma função que receba um vetor de inteiros
        e retorne a soma de todos os seus elementos.
        """,
        "answer_key": """
        public int sum(int[] array) {
            int sum = 0;

            for (int i = 0; i < array.length; i++) {
                sum += array[i];
            }

            return sum;
        }
        """
    },

    {
        "id": 2,
        "topic": "Recursão",
        "question": """
        Implemente uma função recursiva que calcule o fatorial
        de um número inteiro positivo.
        """,
        "answer_key": """
        public int factorial(int number) {
            if (number <= 1) {
                return 1;
            }

            return number * factorial(number - 1);
        }
        """
    },

    {
        "id": 3,
        "topic": "Ordenação",
        "question": """
        Explique como funciona o algoritmo Bubble Sort e qual
        é sua complexidade no pior caso.
        """,
        "answer_key": """
        O Bubble Sort compara elementos adjacentes e troca suas
        posições quando estão fora de ordem.

        Sua complexidade no pior caso é O(n²).
        """
    },

    {
        "id": 4,
        "topic": "Listas Encadeadas",
        "question": """
        Explique como inserir um novo elemento no início de uma
        lista simplesmente encadeada.
        """,
        "answer_key": """
        Deve-se criar um novo nó, fazer o novo nó apontar para
        o antigo primeiro elemento da lista e atualizar o início
        da lista para apontar para o novo nó.
        """
    },

    {
        "id": 5,
        "topic": "Árvores Binárias",
        "question": """
        Explique o que acontece durante um percurso em pré-ordem
        de uma árvore binária.
        """,
        "answer_key": """
        No percurso pré-ordem, primeiro visitamos o nó atual,
        depois percorremos a subárvore esquerda e finalmente
        a subárvore direita.
        """
    }
]