import instructor
from google import genai
from google.genai import types
from src.node_components.llm.adapters.LLMAdapterBase import (
    ChatResponse,
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

        return instructor.from_genai(
            client=model_client,
            mode=instructor.Mode.GENAI_STRUCTURED_OUTPUTS,
        )

    def chat_completion(
        self, messages, stream=False, generation_parameters=...
    ) -> ChatResponse:
        completion_messages = []
        if isinstance(messages, str):
            completion_messages = [
                {
                    "role": "user",
                    "content": messages,
                }
            ]
        else:
            completion_messages = [
                {
                    "role": "user",
                    "content": message.content,
                }
                for message in messages
            ]

        llm_client = self.get_client()

        resp = llm_client.messages.create(
            model=self.model,
            messages=completion_messages,
            response_model=LLMResponse,
            config=types.GenerateContentConfig(
                thinking_config=types.ThinkingConfig(thinking_budget=0)
            ),
        )

        chat_response = ChatResponse(
            content=resp.response,
            usage={},
        )

        return chat_response
