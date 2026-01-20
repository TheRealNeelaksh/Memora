import json
import base64
import httpx
from typing import Optional, Dict, Any
from .contract import VisionOutput

class VisionAdapter:
    def __init__(self, endpoint_url: str, model_name: str, api_key: str = "lm-studio"):
        self.endpoint_url = endpoint_url.rstrip('/')
        self.model_name = model_name
        self.api_key = api_key
        # Check if it's Ollama or OpenAI compatible
        self.is_ollama = "ollama" in self.endpoint_url or "localhost:11434" in self.endpoint_url

    async def analyze_image(self, image_path: str) -> Optional[VisionOutput]:
        """
        Sends image to LLM and returns structured VisionOutput.
        Returns None if analysis fails.
        """
        try:
            with open(image_path, "rb") as img_file:
                base64_image = base64.b64encode(img_file.read()).decode("utf-8")

            # Structured prompt enforcing JSON
            system_prompt = (
                "You are a visual memory assistant. Analyze the image and return a STRICT JSON object. "
                "Do not include markdown formatting (like ```json). "
                "The JSON must have these keys: "
                "summary (1 sentence), description (detailed), activity, setting, social_context, "
                "objects (list of strings), people_count (int), text_content (if any visible text), "
                "weather (if outdoor), time_of_day."
            )

            user_prompt = "Analyze this image."

            payload = self._build_payload(base64_image, system_prompt, user_prompt)

            # Using httpx for async
            async with httpx.AsyncClient(timeout=60.0) as client:
                url = f"{self.endpoint_url}/v1/chat/completions"
                # Handle Ollama specific path if needed, but Ollama now supports /v1/chat/completions

                headers = {"Content-Type": "application/json"}
                if self.api_key and self.api_key.strip():
                    headers["Authorization"] = f"Bearer {self.api_key}"

                response = await client.post(
                    url,
                    headers=headers,
                    json=payload
                )

                if response.status_code != 200:
                    print(f"Vision API Error: {response.status_code} - {response.text}")
                    return None

                data = response.json()
                content = data["choices"][0]["message"]["content"]

                # Cleanup potential markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].strip()
                
                # Regex fallback if it's still not valid JSON or has leading/trailing text
                import re
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                if json_match:
                    content = json_match.group(0)

                try:
                    json_data = json.loads(content)
                    return VisionOutput(**json_data)
                except json.JSONDecodeError:
                    print(f"Failed to decode JSON from LLM. Falling back to raw text.")
                    # Fallback: Use the raw content as the description
                    return VisionOutput(
                        summary=content[:2000],
                        description=content,
                        activity="Unknown",
                        setting="Unknown",
                        social_context="Unknown",
                        objects=[],
                        people_count=0,
                        text_content=None,
                        weather="Unknown",
                        time_of_day="Unknown"
                    )
                except Exception as e:
                    print(f"Validation error: {e}")
                    return None

        except Exception as e:
            print(f"Vision Adapter Error: {e}")
            return None

    async def expand_query(self, query: str) -> str:
        """
        Expands a short query into a descriptive scene sentence using the LLM.
        """
        try:
             async with httpx.AsyncClient(timeout=10.0) as client:
                url = f"{self.endpoint_url}/v1/chat/completions"
                payload = {
                    "model": self.model_name,
                    "messages": [
                        {"role": "system", "content": "You are a keyword optimizer. Convert the user's query into a list of relevant visual keywords and synonyms. Output ONLY the keywords. Do not use full sentences. Do not explain. Example: 'wearing a suit' -> 'suit, formal wear, tuxedo, blazer, business attire, standing man'."},
                        {"role": "user", "content": f"Query: {query}"}
                    ],
                    "temperature": 0.0,
                    "max_tokens": 40
                }

                headers = {"Content-Type": "application/json"}
                if self.api_key and self.api_key.strip():
                    headers["Authorization"] = f"Bearer {self.api_key}"

                response = await client.post(
                    url,
                    headers=headers,
                    json=payload
                )

                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"].strip()
                return query
        except Exception:
            return query

    def _build_payload(self, base64_image, system_prompt, user_prompt):
        # OpenAI / LocalAI standard format
        return {
            "model": self.model_name,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            "temperature": 0.1,
            "max_tokens": 1000,
            # "response_format": {"type": "json_object"}
            # Some local backends (like newer Ollama or LM Studio versions) might be strict about this.
            # We already enforce JSON in the system prompt, so we can relax this to avoid 400 errors.
        }
