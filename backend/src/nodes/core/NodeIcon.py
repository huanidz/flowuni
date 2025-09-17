from typing import Literal, Optional, Union

from pydantic import AnyUrl, BaseModel, Field


class NodeIconHttp(BaseModel):
    icon_type: Literal["http"] = "http"
    icon_value: AnyUrl = Field(..., description="URL to an image or svg")
    color: Optional[str] = None


class NodeIconEmoji(BaseModel):
    icon_type: Literal["emoji"] = "emoji"
    icon_value: str = Field(..., description="Emoji character, e.g. 🧠")
    color: Optional[str] = None


class NodeIconFontAwesome(BaseModel):
    icon_type: Literal["fontawesome"] = "fontawesome"
    icon_value: str = Field(..., description="fa-xxx class name")
    color: Optional[str] = None


class NodeIconMaterial(BaseModel):
    icon_type: Literal["material"] = "material"
    icon_value: str = Field(..., description="Material icon name")
    color: Optional[str] = None


class NodeIconIconify(BaseModel):
    icon_type: Literal["iconify"] = "iconify"
    icon_value: str = Field(..., description="set:name, e.g. lucide:database")
    color: Optional[str] = None


class NodeIconSvg(BaseModel):
    icon_type: Literal["svg"] = "svg"
    icon_value: str = Field(..., description="Inline <svg> string")
    color: Optional[str] = None


NodeIcon = Union[
    NodeIconHttp,
    NodeIconEmoji,
    NodeIconFontAwesome,
    NodeIconMaterial,
    NodeIconIconify,
    NodeIconSvg,
]
