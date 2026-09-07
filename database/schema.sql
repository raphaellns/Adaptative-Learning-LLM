CREATE TABLE users (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    name VARCHAR(150) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP

);


CREATE TABLE exams (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    user_id BIGINT NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_exams_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE

);


CREATE TABLE exam_questions (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    exam_id BIGINT NOT NULL,

    question TEXT NOT NULL,

    answer_key TEXT NOT NULL,

    student_answer TEXT NOT NULL,

    CONSTRAINT fk_exam_questions_exam
        FOREIGN KEY (exam_id)
        REFERENCES exams(id)
        ON DELETE CASCADE

);


CREATE TABLE analyses (

    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    question_id BIGINT NOT NULL UNIQUE,

    correta BOOLEAN NOT NULL,

    topico VARCHAR(150) NOT NULL,

    erro_principal TEXT NOT NULL,

    explicacao TEXT NOT NULL,

    recomendacoes TEXT,

    CONSTRAINT fk_analyses_question
        FOREIGN KEY (question_id)
        REFERENCES exam_questions(id)
        ON DELETE CASCADE

);