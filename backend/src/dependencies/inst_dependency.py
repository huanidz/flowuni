# app/dependencies/instructor_ext.py
from typing import TYPE_CHECKING, Optional

from src.configs.config import get_settings
from src.utils.chat_completion_utils import get_current_time

if TYPE_CHECKING:
    from google.oauth2.service_account import Credentials
    from instructor import Instructor, Mode, from_vertexai
    from vertexai import init
    from vertexai.generative_models import GenerativeModel


class InstructorService:
    def __init__(self, project_id: str, location: str, credentials_path: str):
        credentials = Credentials.from_service_account_file(credentials_path)
        init(project=project_id, location=location, credentials=credentials)

    def get_client(
        self,
        model_name: str,
        system_instruction: Optional[str] = None,
        mixin_instruction: Optional[str] = None,
    ) -> Instructor:
        DEFAULT_MIXIN_INSTRUCTION = (
            f"Thời gian hiện tại: {get_current_time(timezone=7)}\n"
            f"Sử dụng ngôn ngữ giống với User trong output (Nếu không nhận ra ngôn ngữ của user, sử dụng tiếng Anh.)\n"
            f"Khi có media (ảnh, audio) thì không mô tả chúng, cố gắng hiểu ý đồ của người dùng thông qua ảnh. Nếu không hiểu thì hỏi người dùng để làm rõ mong muốn của họ."
        )

        final_mixin = (
            mixin_instruction if mixin_instruction else DEFAULT_MIXIN_INSTRUCTION
        )
        combined_instruction = (
            f"{system_instruction}\n\n{final_mixin}"
            if system_instruction
            else final_mixin
        )

        model = GenerativeModel(
            model_name=model_name,
            system_instruction=[combined_instruction],
        )
        return from_vertexai(client=model, mode=Mode.VERTEXAI_JSON)


# Get settings and create global instance
settings = get_settings()
instructor_service = InstructorService(
    project_id=settings.VERTEX_AI_SERVICE_PROJECT_ID,
    location=settings.VERTEX_AI_SERVICE_LOCATION,
    credentials_path=settings.VERTEX_AI_SERVICE_ACCOUNT_CREDENTIALS,
)
