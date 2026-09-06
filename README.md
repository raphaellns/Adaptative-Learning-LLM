# Adaptive Learning LLM

An AI-powered adaptive learning system designed to analyze programming assessments, identify students' learning gaps, and generate personalized study plans based on their performance.

The project aims to combine Large Language Models with educational data to provide individualized learning support, helping students understand their mistakes and focus their studies on the topics where they need the most improvement.

## Author

**Raphaell Nunes e Silva**

Instituto Federal Sul-rio-grandense (IFSul)
Campus Bagé

## Overview

Traditional assessment systems generally focus on determining whether an answer is correct or incorrect. This project goes further by analyzing the student's response in context and using the results to build an individualized learning profile.

The system analyzes programming questions and student answers to identify:

* Whether the answer is correct
* The main error made by the student
* The main topic involved
* A didactic explanation of the mistake
* Recommended topics and activities for further study

The collected performance data is used to identify learning priorities and generate personalized study plans.

## Objectives

The main objective of the project is to develop an adaptive learning environment capable of using artificial intelligence to personalize the learning process.

The system is designed to:

* Analyze programming assessments automatically
* Identify conceptual, logical, and technical mistakes
* Track student performance over time
* Identify topics with greater learning difficulties
* Generate personalized study recommendations
* Adapt future study plans according to the student's history
* Provide a foundation for integrating educational materials into the analysis process

## How It Works

The general process can be summarized as:

```text
Assessment
    ↓
Question and Answer Analysis
    ↓
Error and Topic Identification
    ↓
Student Performance Profile
    ↓
Learning Priorities
    ↓
Personalized Study Plan
    ↓
Historical Performance
    ↓
Adaptive Recommendations
```

The system uses a Large Language Model to interpret the student's responses rather than relying exclusively on predefined answer matching.

## Artificial Intelligence

The project uses **Qwen3** as the language model, running locally through **Ollama**.

Local inference allows the system to process student data without depending on external AI APIs and provides greater control over the model used during development and evaluation.

The AI component is responsible for understanding the question, comparing the student's response with the expected solution, identifying errors, classifying the main topic, and generating educational feedback.

## Initial Learning Domain

The initial educational domain is **Algorithms I**, with a focus on programming fundamentals using the **C programming language**.

The system is designed so that the same architecture can later be expanded to other subjects and learning domains.

## Technology Stack

### Backend

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* Pydantic

### Artificial Intelligence

* Qwen3
* Ollama

### Frontend

* HTML
* CSS
* JavaScript

## Database

PostgreSQL is used as the persistence layer for the application.

The database stores information required for user management, assessments, question analyses, and student performance history.

This persistent data allows the system to build a long-term learning profile instead of treating each assessment as an isolated event.

## Adaptive Learning

The central concept of the project is the use of historical performance to personalize future recommendations.

For example, repeated difficulties in a specific topic can increase its priority in the student's study plan, while topics with consistently strong performance can receive less emphasis.

This creates a continuous cycle:

```text
Study
  ↓
Assessment
  ↓
Analysis
  ↓
Feedback
  ↓
Personalized Study Plan
  ↓
Study
```

## Validation

The language model is evaluated using manually labeled programming questions.

The evaluation considers different aspects of the analysis, including:

* Correct/incorrect answer classification
* Topic classification
* Identification of the student's main error
* Consistency of the generated explanation

The validation process is intended to measure how reliably the model can support the educational objectives of the system.

## Future Expansion

The architecture is designed to support additional capabilities such as:

* OCR-based exam input
* Historical performance analysis
* Retrieval-Augmented Generation (RAG)
* Integration with course and educational materials
* More advanced adaptive learning strategies
* Web and mobile interfaces
* Additional programming languages and academic subjects

## Running the Project

### Clone the repository

```bash
git clone https://github.com/raphaellns/Adaptative-Learning-LLM.git
cd Adaptative-Learning-LLM
```

### Create a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate
```

### Install dependencies

```bash
python -m pip install -r requirements.txt
```

### Configure the environment

Create a `.env` file and configure the required environment variables.

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/adaptive_learning
```

### Start the API

```bash
uvicorn app.api:app --reload
```

The API documentation will be available at:

```text
http://127.0.0.1:8000/docs
```

### Start the frontend

```bash
cd frontend
python3 -m http.server 5500
```

The frontend will be available at:

```text
http://127.0.0.1:5500
```

## Academic Context

This project is being developed as an academic project at the **Instituto Federal Sul-rio-grandense (IFSul), Campus Bagé**, with the objective of exploring the application of Large Language Models and adaptive learning techniques in programming education.
