def build_student_profile(results):

    total_questions = len(results)

    correct = sum(
        1 for result in results
        if result["correta"]
    )

    incorrect = total_questions - correct

    accuracy = (
        correct / total_questions * 100
        if total_questions > 0
        else 0
    )

    topics = {}

    for result in results:

        topic = result["topico"]

        if topic not in topics:
            topics[topic] = {
                "correct": 0,
                "incorrect": 0,
                "accuracy": 0
            }

        if result["correta"]:
            topics[topic]["correct"] += 1
        else:
            topics[topic]["incorrect"] += 1

    for topic in topics:

        topic_total = (
            topics[topic]["correct"]
            + topics[topic]["incorrect"]
        )

        topics[topic]["accuracy"] = (
            topics[topic]["correct"]
            / topic_total
            * 100
        )

    return {
        "total_questions": total_questions,
        "correct": correct,
        "incorrect": incorrect,
        "accuracy": accuracy,
        "topics": topics
    }