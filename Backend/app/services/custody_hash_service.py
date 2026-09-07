import hashlib
import json


def calculate_custody_hash(data: dict) -> str:
    """
    Calculate SHA-256 hash for a custody record.
    The data is serialized with sorted keys so the
    same input always produces the same hash.
    """

    json_data = json.dumps(
        data,
        sort_keys=True,
        default=str
    )

    return hashlib.sha256(
        json_data.encode("utf-8")
    ).hexdigest()