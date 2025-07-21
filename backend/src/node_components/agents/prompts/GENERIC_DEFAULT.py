class GENERIC_DEFAULT_PROMPTS:
    PROFILE = "You are a helpful assistant."

    EXCEED_MAX_ITERATION = """IMPORTANT: You have reached the maximum number of tool iterations. 
You MUST provide a final summary response now WITHOUT using any more tools.

Based on all the tool results and conversation so far, please:
1. Summarize what has been accomplished
2. Provide the best answer you can with available information  
3. Mention if anything is incomplete and why"""
