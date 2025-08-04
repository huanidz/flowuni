import instructor
from google import genai
from src.node_components.llm.adapters.LLMAdapterBase import (
    LLMAdapterBase,
    LLMResponse,
)


class GoogleGeminiProvider(LLMAdapterBase):
    def __init__(self, model: str, system_prompt: str, api_key: str):
        self.api_key = api_key
        self.model = model
        self.system_prompt = system_prompt

    def get_client(self) -> instructor.Instructor:
        model_client = genai.Client(
            api_key=self.api_key,
        )

        return instructor.from_gemini(
            client=model_client,
            mode=instructor.Mode.GEMINI_JSON,
        )

    def chat_completion(self, messages, stream=False, generation_parameters=...):
        llm_client = self.get_client()

        resp = llm_client.messages.create(
            messages=[
                {
                    "role": "user",
                    "content": "Extract Jason is 25 years old.",
                }
            ],
            response_model=LLMResponse,
        )
