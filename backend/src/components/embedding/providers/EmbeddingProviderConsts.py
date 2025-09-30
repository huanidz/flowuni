class EmbeddingProviderConsts:
    OPENAI = "openai"
    GOOGLE = "google"
    OPENROUTER = "openrouter"

    # Default models for each provider
    DEFAULT_MODELS = {
        OPENAI: "text-embedding-ada-002",
        GOOGLE: "gemini-embedding-001",
        OPENROUTER: "text-embedding-ada-002",
    }

    # Supported providers
    SUPPORTED_PROVIDERS = [OPENAI, GOOGLE, OPENROUTER]
