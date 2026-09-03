student_answers = {
    1: """
    public static int sum(int[] array) {
        int total = 0;

        for (int i = 0; i <= array.length; i++) {
            total += array[i];
        }

        return total;
    }
    """,

    2: """
    A função verifica se o número é menor ou igual a 1.
    Se for, retorna 1. Caso contrário, chama a própria função
    com number - 1 e multiplica pelo número atual.
    """,

    3: """
    Bubble Sort compara elementos vizinhos e troca quando estão
    na ordem errada. No pior caso sua complexidade é O(n).
    """,

    4: """
    Primeiro criamos um novo nó. Depois fazemos o novo nó apontar
    para o antigo início da lista e atualizamos o início da lista
    para apontar para o novo nó.
    """,

    5: """
    Na pré-ordem, primeiro visitamos a raiz, depois a subárvore
    esquerda e finalmente a subárvore direita.
    """
}