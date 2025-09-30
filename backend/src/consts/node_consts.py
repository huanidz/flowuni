class NODE_DATA_MODE:
    """Node execution modes."""

    NORMAL = "NormalMode"
    TOOL = "ToolMode"


class NODE_EXECUTION_STATUS:
    DRAFT = "draft"
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class NODE_LABEL_CONSTS:
    ROUTER = "Router"


class SPECIAL_NODE_INPUT_CONSTS:
    ROUTER_ROUTE_LABELS = "route_labels"


class NODE_GROUP_CONSTS:
    DEFAULT = "default"
    AGENT = "agent"
    GROUP_TEST = "test"
    TRIAL = "trial"
    DATABASE = "database"
    PROVIDER = "provider"


class NODE_TAGS_CONSTS:
    SESSION_ENABLED = "session-enabled"
    ROUTING = "routing"
