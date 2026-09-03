def calculate_study_priorities(profile):

    topics = profile["topics"]

    priorities = []

    for topic, data in topics.items():

        priority = 100 - data["accuracy"]

        priorities.append({
            "topic": topic,
            "accuracy": data["accuracy"],
            "priority": priority
        })

    priorities.sort(
        key=lambda item: item["priority"],
        reverse=True
    )

    return priorities