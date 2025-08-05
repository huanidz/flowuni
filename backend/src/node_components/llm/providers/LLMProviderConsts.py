class LLMProviderName:
    GOOGLE_GEMINI = "google-gemini"
    OPEN_AI = "openai"

    @staticmethod
    def get_all():
        return [LLMProviderName.GOOGLE_GEMINI, LLMProviderName.OPEN_AI]
