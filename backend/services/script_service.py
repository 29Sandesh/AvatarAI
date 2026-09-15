"""
AI Script Generation Service
Generates structured, professional scripts for avatars based on prompts and templates.
"""

import random

TEMPLATES = {
    "welcome": [
        "Hello and welcome! I am your AI presenter. Today, I'm thrilled to guide you through our latest features and show you how effortless video creation can be. Let's dive right in!",
        "Hi there! Welcome to the future of digital storytelling. Whether you are creating content for business, education, or social media, I'm here to bring your message to life.",
    ],
    "product": [
        "Introducing our brand new solution designed to save you hours of work. With cutting-edge artificial intelligence, you can now automate your workflow and focus on what truly matters. Try it today and experience the difference!",
        "Are you ready to transform the way you create? Our newest product combines speed, simplicity, and state-of-the-art AI to deliver results you'll love. Let's see it in action!",
    ],
    "explainer": [
        "Did you know that videos retain 95% more information than standard text? In this quick overview, we'll break down the top three concepts you need to know to succeed in this domain.",
        "Let's break down this complex idea into three simple steps. First, define your goal. Second, leverage the right tools. And third, execute consistently. It really is that straightforward.",
    ],
    "social": [
        "Stop scrolling! If you've been looking for an easier way to level up your content game, this is your sign. Watch until the end for my favorite secret tip!",
        "Hey everyone! Quick update for you today. We just dropped something huge, and I couldn't wait to share it with all of you. Tap the link in our bio to check it out!",
    ],
}


def generate_script(
    prompt: str = "",
    category: str = "welcome",
    tone: str = "professional",
) -> dict:
    """
    Generate a script from a prompt or category.

    Args:
        prompt: User's custom request or idea.
        category: Category if prompt is generic (welcome, product, explainer, social).
        tone: Tone of voice (professional, friendly, energetic, concise).

    Returns:
        dict with script, word_count, and estimated_duration.
    """
    clean_prompt = prompt.strip() if prompt else ""

    if not clean_prompt:
        base_script = random.choice(
            TEMPLATES.get(category, TEMPLATES["welcome"])
        )
    else:
        # Generate script based on prompt
        words = clean_prompt.split()
        if len(words) <= 4:
            base_script = (
                f"Hello! Today we are exploring {clean_prompt}. "
                f"This is an exciting opportunity to understand how {clean_prompt} "
                f"can create real value for you and your audience. "
                f"Stay tuned as we walk through everything step by step!"
            )
        else:
            base_script = (
                f"Welcome! Let's talk about {clean_prompt}. "
                f"With recent advancements, getting started has never been easier. "
                f"We are here to help you achieve your goals and turn ideas into reality. "
                f"Thank you for watching!"
            )

    # Calculate word count & estimated duration (~150 words per minute)
    word_count = len(base_script.split())
    estimated_seconds = round((word_count / 150) * 60, 1)

    return {
        "script": base_script,
        "word_count": word_count,
        "estimated_duration_seconds": estimated_seconds,
        "category": category,
        "tone": tone,
    }
