from pydantic import BaseModel
from typing import List, Optional

class VisionOutput(BaseModel):
    summary: str
    description: str
    activity: str
    setting: str
    social_context: str
    objects: List[str]
    people_count: int
    text_content: Optional[str] = None
    dominant_colors: Optional[List[str]] = None
    weather: Optional[str] = None
    time_of_day: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "summary": "A group of friends playing cards at a table indoors.",
                "description": "Four people are seated around a wooden table playing a card game.",
                "activity": "playing cards",
                "setting": "indoor",
                "social_context": "friends",
                "objects": ["cards", "table", "chairs", "drinks"],
                "people_count": 4,
                "text_content": "Ace of Spades",
                "dominant_colors": ["brown", "white", "red"],
                "weather": "n/a",
                "time_of_day": "evening"
            }
        }
