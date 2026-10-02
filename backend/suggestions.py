"""Static, rule-based suggestions. No AI."""

INTEREST_RULES = {
    ("web", "frontend", "react", "html", "css", "javascript"): {
        "skills": ["JavaScript/TypeScript", "React", "Git & GitHub", "REST APIs"],
        "steps": ["Build and deploy 3 small projects", "Learn a backend (FastAPI or Node)"],
    },
    ("data", "python", "analytics", "ml", "machine learning", "ai"): {
        "skills": ["Python", "SQL", "Pandas", "Data visualization"],
        "steps": ["Finish a Kaggle beginner competition", "Publish one analysis on GitHub"],
    },
    ("design", "ui", "ux", "figma", "art"): {
        "skills": ["Figma", "Typography & color basics", "User research"],
        "steps": ["Redesign one existing app and document why", "Build a 3-case portfolio"],
    },
    ("business", "marketing", "sales", "startup"): {
        "skills": ["Communication", "Excel/Sheets", "Digital marketing basics"],
        "steps": ["Run a tiny real campaign or side venture", "Talk to 5 people in the field"],
    },
}

EDU_RULES = {
    "school": "Explore fields via free courses before choosing a stream.",
    "diploma": "Add practical projects; consider a bridge/lateral-entry degree later.",
    "b.tech": "Aim for 2 internships and a strong GitHub profile before final year.",
    "bachelor": "Pick one specialization and build proof-of-work around it.",
    "master": "Target research, senior roles, or specialization-focused certifications.",
}


def build_suggestions(profile: dict) -> dict:
    interests = profile["interests"].lower()
    edu = profile["education"].lower()
    skills, steps = [], []

    for keywords, rule in INTEREST_RULES.items():
        if any(k in interests for k in keywords):
            skills += rule["skills"]
            steps += rule["steps"]

    if not skills:
        skills = ["Communication", "Problem solving", "Basic computer skills"]
        steps = ["Try 3 free intro courses in different areas and note what you enjoy"]

    general = [
        f"Join local meetups or communities in or near {profile['city']}.",
        "Build a simple portfolio or LinkedIn profile.",
        "Set one weekly learning goal and track it.",
    ]
    for key, tip in EDU_RULES.items():
        if key in edu:
            general.insert(0, tip)
            break

    dedupe = lambda xs: list(dict.fromkeys(xs))
    return {"skills": dedupe(skills), "learning_steps": dedupe(steps), "general": general}
