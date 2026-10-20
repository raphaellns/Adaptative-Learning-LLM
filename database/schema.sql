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


-- Avaliações publicadas por professores e respostas dos estudantes.
-- O gabarito permanece no banco e não é enviado às rotas de estudante.
CREATE TABLE assessments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    teacher_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessments_teacher
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE assessment_questions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    answer_key TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    CONSTRAINT fk_assessment_questions_assessment
        FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

CREATE INDEX ix_assessment_questions_assessment_id
    ON assessment_questions(assessment_id);

CREATE TABLE assessment_submissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assessment_question_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    exam_question_id BIGINT NOT NULL UNIQUE,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessment_submissions_question
        FOREIGN KEY (assessment_question_id) REFERENCES assessment_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_submissions_student
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_submissions_exam_question
        FOREIGN KEY (exam_question_id) REFERENCES exam_questions(id) ON DELETE CASCADE
);

CREATE INDEX ix_assessment_submissions_assessment_question_id
    ON assessment_submissions(assessment_question_id);
CREATE INDEX ix_assessment_submissions_student_id
    ON assessment_submissions(student_id);
