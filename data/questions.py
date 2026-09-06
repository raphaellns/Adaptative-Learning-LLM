questions = [

    # =========================================================
    # DECLARAÇÃO DE VARIÁVEIS
    # =========================================================

    {
        "id": 1,
        "topic": "Declaração de variáveis",
        "question": """
        Em linguagem C, declare uma variável inteira chamada idade
        e inicialize seu valor com 18.
        """,
        "answer_key": """
        int idade = 18;
        """,
        "student_answer": """
        int idade = 18;
        """,
        "expected_correct": True
    },

    {
        "id": 2,
        "topic": "Declaração de variáveis",
        "question": """
        Declare uma variável do tipo float chamada altura e uma
        variável do tipo char chamada inicial.
        """,
        "answer_key": """
        float altura;
        char inicial;
        """,
        "student_answer": """
        float altura;
        char inicial;
        """,
        "expected_correct": True
    },

    {
        "id": 3,
        "topic": "Declaração de variáveis",
        "question": """
        Qual tipo de dado deve ser utilizado em C para armazenar
        um número inteiro, como 25?
        """,
        "answer_key": """
        O tipo int.
        """,
        "student_answer": """
        Deve ser usado o tipo float.
        """,
        "expected_correct": False
    },

    {
        "id": 4,
        "topic": "Declaração de variáveis",
        "question": """
        Declare uma variável inteira chamada idade e atribua a ela
        o valor 20.
        """,
        "answer_key": """
        int idade = 20;
        """,
        "student_answer": """
        int idade;
        idade = 20;
        """,
        "expected_correct": True
    },

    {
        "id": 5,
        "topic": "Declaração de variáveis",
        "question": """
        Declare uma variável chamada nome para armazenar apenas
        um caractere.
        """,
        "answer_key": """
        char nome;
        """,
        "student_answer": """
        string nome;
        """,
        "expected_correct": False
    },


    # =========================================================
    # ENTRADA E SAÍDA DE DADOS
    # =========================================================

    {
        "id": 6,
        "topic": "Entrada e saída de dados",
        "question": """
        Escreva um programa em C que leia um número inteiro
        digitado pelo usuário e depois mostre esse número na tela.
        """,
        "answer_key": """
        int numero;

        scanf("%d", &numero);

        printf("%d", numero);
        """,
        "student_answer": """
        int numero;

        scanf("%d", &numero);

        printf("%d", numero);
        """,
        "expected_correct": True
    },

    {
        "id": 7,
        "topic": "Entrada e saída de dados",
        "question": """
        Qual função da linguagem C é normalmente utilizada para
        receber dados digitados pelo usuário?
        """,
        "answer_key": """
        scanf.
        """,
        "student_answer": """
        printf.
        """,
        "expected_correct": False
    },

    {
        "id": 8,
        "topic": "Entrada e saída de dados",
        "question": """
        Escreva uma instrução para mostrar o valor de uma variável
        inteira chamada idade utilizando printf.
        """,
        "answer_key": """
        printf("%d", idade);
        """,
        "student_answer": """
        printf("%d", idade);
        """,
        "expected_correct": True
    },

    {
        "id": 9,
        "topic": "Entrada e saída de dados",
        "question": """
        Escreva um programa que leia dois números inteiros e mostre
        a soma deles.
        """,
        "answer_key": """
        int a, b;

        scanf("%d %d", &a, &b);

        printf("%d", a + b);
        """,
        "student_answer": """
        int a, b;

        scanf("%d %d", &a, &b);

        printf("%d", a + b);
        """,
        "expected_correct": True
    },

    {
        "id": 10,
        "topic": "Entrada e saída de dados",
        "question": """
        Escreva uma instrução para ler um número inteiro armazenado
        na variável idade.
        """,
        "answer_key": """
        scanf("%d", &idade);
        """,
        "student_answer": """
        scanf("%d", idade);
        """,
        "expected_correct": False
    },


    # =========================================================
    # ESTRUTURAS CONDICIONAIS
    # =========================================================

    {
        "id": 11,
        "topic": "Estruturas condicionais",
        "question": """
        Escreva um programa em C que leia a idade de uma pessoa e
        mostre "Maior de idade" caso ela tenha 18 anos ou mais.
        """,
        "answer_key": """
        int idade;

        scanf("%d", &idade);

        if (idade >= 18) {
            printf("Maior de idade");
        }
        """,
        "student_answer": """
        int idade;

        scanf("%d", &idade);

        if (idade >= 18) {
            printf("Maior de idade");
        }
        """,
        "expected_correct": True
    },

    {
        "id": 12,
        "topic": "Estruturas condicionais",
        "question": """
        Qual estrutura da linguagem C deve ser utilizada para
        executar um bloco de código somente quando uma condição
        for verdadeira?
        """,
        "answer_key": """
        A estrutura if.
        """,
        "student_answer": """
        A estrutura while.
        """,
        "expected_correct": False
    },

    {
        "id": 13,
        "topic": "Estruturas condicionais",
        "question": """
        Faça um programa que leia um número inteiro e informe se
        ele é positivo ou negativo.
        """,
        "answer_key": """
        int numero;

        scanf("%d", &numero);

        if (numero >= 0) {
            printf("Positivo");
        } else {
            printf("Negativo");
        }
        """,
        "student_answer": """
        int numero;

        scanf("%d", &numero);

        if (numero >= 0) {
            printf("Positivo");
        }
        else {
            printf("Negativo");
        }
        """,
        "expected_correct": True
    },

    {
        "id": 14,
        "topic": "Estruturas condicionais",
        "question": """
        O que acontece quando a condição de um if é falsa e existe
        um bloco else?
        """,
        "answer_key": """
        O bloco do else será executado.
        """,
        "student_answer": """
        O programa repete o if até a condição ficar verdadeira.
        """,
        "expected_correct": False
    },

    {
        "id": 15,
        "topic": "Estruturas condicionais",
        "question": """
        Faça um programa que leia um número inteiro e mostre
        "Par" caso ele seja divisível por 2 e "Ímpar" caso contrário.
        """,
        "answer_key": """
        int numero;

        scanf("%d", &numero);

        if (numero % 2 == 0) {
            printf("Par");
        } else {
            printf("Ímpar");
        }
        """,
        "student_answer": """
        int numero;

        scanf("%d", &numero);

        if (numero % 2 = 0) {
            printf("Par");
        } else {
            printf("Ímpar");
        }
        """,
        "expected_correct": False
    },


    # =========================================================
    # ESTRUTURAS DE REPETIÇÃO
    # =========================================================

    {
        "id": 16,
        "topic": "Estruturas de repetição",
        "question": """
        Escreva um programa que mostre na tela os números de 1 até 5
        utilizando um while.
        """,
        "answer_key": """
        int i = 1;

        while (i <= 5) {
            printf("%d", i);
            i++;
        }
        """,
        "student_answer": """
        int i = 1;

        while (i <= 5) {
            printf("%d", i);
            i++;
        }
        """,
        "expected_correct": True
    },

    {
        "id": 17,
        "topic": "Estruturas de repetição",
        "question": """
        Qual estrutura de repetição é adequada quando queremos
        repetir um bloco de código enquanto uma condição for
        verdadeira?
        """,
        "answer_key": """
        Uma estrutura while pode ser utilizada.
        """,
        "student_answer": """
        A estrutura if.
        """,
        "expected_correct": False
    },

    {
        "id": 18,
        "topic": "Estruturas de repetição",
        "question": """
        Escreva um programa que utilize for para mostrar os números
        de 1 até 10.
        """,
        "answer_key": """
        for (int i = 1; i <= 10; i++) {
            printf("%d", i);
        }
        """,
        "student_answer": """
        for (int i = 1; i <= 10; i++) {
            printf("%d", i);
        }
        """,
        "expected_correct": True
    },

    {
        "id": 19,
        "topic": "Estruturas de repetição",
        "question": """
        Qual é a principal característica do do while em relação
        ao while?
        """,
        "answer_key": """
        O do while executa o bloco pelo menos uma vez antes de
        verificar a condição.
        """,
        "student_answer": """
        O do while nunca executa o bloco caso a condição seja falsa.
        """,
        "expected_correct": False
    },

    {
        "id": 20,
        "topic": "Estruturas de repetição",
        "question": """
        Escreva um programa que utilize while para contar de 1 até 3.
        """,
        "answer_key": """
        int contador = 1;

        while (contador <= 3) {
            printf("%d", contador);
            contador++;
        }
        """,
        "student_answer": """
        int contador = 1;

        while (contador <= 3) {
            printf("%d", contador);
        }
        """,
        "expected_correct": False
    },


    # =========================================================
    # LÓGICA DE PROGRAMAÇÃO
    # =========================================================

    {
        "id": 21,
        "topic": "Lógica de programação",
        "question": """
        Faça um programa em C que leia o lado de um quadrado e
        calcule sua área.
        """,
        "answer_key": """
        int lado;
        int area;

        scanf("%d", &lado);

        area = lado * lado;

        printf("%d", area);
        """,
        "student_answer": """
        int lado;
        int area;

        scanf("%d", &lado);

        area = lado + lado;

        printf("%d", area);
        """,
        "expected_correct": False
    },

    {
        "id": 22,
        "topic": "Lógica de programação",
        "question": """
        Considere duas variáveis inteiras chamadas base e altura.
        Escreva a expressão utilizada para calcular a área de um
        retângulo, sabendo que a área é dada por base × altura.
        """,
        "answer_key": """
        area = base * altura;
        """,
        "student_answer": """
        area = base * altura;
        """,
        "expected_correct": True
    },

    {
        "id": 23,
        "topic": "Lógica de programação",
        "question": """
        Um programa deve ler dois números inteiros e calcular
        a média deles. Escreva a lógica principal do cálculo.
        """,
        "answer_key": """
        media = (a + b) / 2;
        """,
        "student_answer": """
        media = a + b / 2;
        """,
        "expected_correct": False
    },

    {
        "id": 24,
        "topic": "Lógica de programação",
        "question": """
        Considere uma variável chamada celsius contendo uma
        temperatura em graus Celsius. Escreva a expressão matemática
        utilizada para convertê-la para Fahrenheit, sabendo que:

        F = C × 9 / 5 + 32
        """,
        "answer_key": """
        fahrenheit = celsius * 9 / 5 + 32;
        """,
        "student_answer": """
        fahrenheit = celsius * 9 / 5 + 32;
        """,
        "expected_correct": True
    },

    {
        "id": 25,
        "topic": "Lógica de programação",
        "question": """
        Um programa deve ler o preço de um produto e calcular
        um desconto de 10%. O preço final deve ser armazenado
        em uma variável chamada preco_final.
        """,
        "answer_key": """
        desconto = preco * 0.10;
        preco_final = preco - desconto;
        """,
        "student_answer": """
        desconto = preco * 0.10;
        preco_final = preco + desconto;
        """,
        "expected_correct": False
    },


    # =========================================================
    # SINTAXE DA LINGUAGEM C
    # =========================================================

    {
        "id": 26,
        "topic": "Sintaxe da linguagem C",
        "question": """
        Identifique e corrija o erro no código abaixo:

        int idade = 18
        printf("%d", idade);
        """,
        "answer_key": """
        Falta um ponto e vírgula na declaração da variável.

        Código correto:

        int idade = 18;
        printf("%d", idade);
        """,
        "student_answer": """
        O erro está na declaração da variável.
        Falta um ponto e vírgula.

        Código correto:

        int idade = 18;
        printf("%d", idade);
        """,
        "expected_correct": True
    },

    {
        "id": 27,
        "topic": "Sintaxe da linguagem C",
        "question": """
        Identifique o erro no código:

        if (idade >= 18 {
            printf("Maior de idade");
        }
        """,
        "answer_key": """
        Falta fechar o parêntese da condição do if.

        Código correto:

        if (idade >= 18) {
            printf("Maior de idade");
        }
        """,
        "student_answer": """
        O erro está no printf.
        É necessário colocar outro ponto e vírgula no final.
        """,
        "expected_correct": False
    },

    {
        "id": 28,
        "topic": "Sintaxe da linguagem C",
        "question": """
        Identifique e corrija o erro no código:

        int numero
        scanf("%d", &numero);
        """,
        "answer_key": """
        Falta um ponto e vírgula após a declaração da variável.

        Código correto:

        int numero;
        scanf("%d", &numero);
        """,
        "student_answer": """
        int numero;
        scanf("%d", &numero);
        """,
        "expected_correct": True
    },

    {
        "id": 29,
        "topic": "Sintaxe da linguagem C",
        "question": """
        Identifique o erro de sintaxe no código abaixo:

        for (int i = 0; i < 10; i++ {
            printf("%d", i);
        }
        """,
        "answer_key": """
        Falta fechar o parêntese da declaração do for.

        O correto é:

        for (int i = 0; i < 10; i++) {
            printf("%d", i);
        }
        """,
        "student_answer": """
        Falta uma chave depois do i++.

        for (int i = 0; i < 10; i++ {
            printf("%d", i);
        }
        """,
        "expected_correct": False
    },

    {
        "id": 30,
        "topic": "Sintaxe da linguagem C",
        "question": """
        Corrija o código abaixo para que ele compile corretamente:

        int idade = 20;
        printf("%d", idade)
        """,
        "answer_key": """
        int idade = 20;
        printf("%d", idade);
        """,
        "student_answer": """
        int idade = 20;
        printf("%d", idade);
        """,
        "expected_correct": True
    }
]