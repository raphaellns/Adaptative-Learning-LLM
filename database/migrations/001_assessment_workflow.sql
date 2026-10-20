-- Run as the owner of schema public. The application role receives only the
-- table and identity-sequence privileges needed by the assessment API.
-- With psql, pass: -v app_role='the_username_from_DATABASE_URL'

CREATE TABLE IF NOT EXISTS public.assessments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    teacher_id BIGINT NOT NULL,
    title VARCHAR(150) NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessments_teacher
        FOREIGN KEY (teacher_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assessment_id BIGINT NOT NULL,
    question TEXT NOT NULL,
    answer_key TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    CONSTRAINT fk_assessment_questions_assessment
        FOREIGN KEY (assessment_id) REFERENCES public.assessments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_assessment_questions_assessment_id
    ON public.assessment_questions(assessment_id);

CREATE TABLE IF NOT EXISTS public.assessment_submissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assessment_question_id BIGINT NOT NULL,
    student_id BIGINT NOT NULL,
    exam_question_id BIGINT NOT NULL UNIQUE,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_assessment_submissions_question
        FOREIGN KEY (assessment_question_id)
        REFERENCES public.assessment_questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_submissions_student
        FOREIGN KEY (student_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessment_submissions_exam_question
        FOREIGN KEY (exam_question_id)
        REFERENCES public.exam_questions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_assessment_submissions_assessment_question_id
    ON public.assessment_submissions(assessment_question_id);
CREATE INDEX IF NOT EXISTS ix_assessment_submissions_student_id
    ON public.assessment_submissions(student_id);

GRANT USAGE ON SCHEMA public TO :"app_role";

GRANT SELECT, INSERT, UPDATE, DELETE
    ON TABLE public.assessments, public.assessment_questions, public.assessment_submissions
    TO :"app_role";

GRANT USAGE, SELECT
    ON SEQUENCE public.assessments_id_seq,
        public.assessment_questions_id_seq,
        public.assessment_submissions_id_seq
    TO :"app_role";
