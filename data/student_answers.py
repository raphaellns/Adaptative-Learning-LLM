student_answers = {
    1: """
    public int sum(int[] array) {
        int sum = 0;

        for (int i = 0; i <= array.length; i++) {
            sum += array[i];
        }

        return sum;
    }
    """,

    2: """
    public int factorial(int number) {
        return number * factorial(number - 1);
    }
    """,

    3: """
    Bubble Sort compara os elementos do vetor e vai colocando
    os maiores elementos no final.

    A complexidade é O(n).
    """,

    4: """
    Para inserir no começo basta criar um novo nó e fazer ele
    apontar para o primeiro nó atual.
    """,

    5: """
    Primeiro visita a esquerda, depois a raiz e depois a direita.
    """
}