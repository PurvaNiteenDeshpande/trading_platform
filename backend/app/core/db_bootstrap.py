from pathlib import Path
from typing import Dict, List

from backend.app.db.session import get_connection

SQL_FILES = [
    "schema.sql",
    "constraints.sql",
    "functions.sql",
    "triggers.sql",
    "seed_data.sql",
]

CORE_TABLES = {
    "investors",
    "portfolio",
    "stocks",
    "stock_prices",
    "orders",
    "trades",
    "holdings",
}


def _database_dir() -> Path:
    return Path(__file__).resolve().parents[3] / "database"


def _split_sql_statements(sql_text: str):
    delimiter = ";"
    buffer: List[str] = []

    for raw_line in sql_text.splitlines():
        stripped = raw_line.strip()

        if not stripped or stripped.startswith("--"):
            continue

        if stripped.upper().startswith("DELIMITER "):
            delimiter = stripped.split(None, 1)[1]
            continue

        buffer.append(raw_line)
        candidate = "\n".join(buffer).rstrip()

        if candidate.endswith(delimiter):
            statement = candidate[: -len(delimiter)].strip()
            if statement:
                yield statement
            buffer = []

    tail = "\n".join(buffer).strip()
    if tail:
        yield tail


def _ignorable_error(error_message: str) -> bool:
    msg = error_message.lower()
    tokens = [
        "already exists",
        "duplicate entry",
        "duplicate key name",
        "multiple primary key defined",
    ]
    return any(token in msg for token in tokens)


def _run_sql_file(cursor, file_path: Path) -> Dict:
    if not file_path.exists():
        return {"file": file_path.name, "executed": 0, "skipped": 0, "missing": True}

    statements = list(_split_sql_statements(file_path.read_text(encoding="utf-8")))
    executed = 0
    skipped = 0

    for statement in statements:
        try:
            cursor.execute(statement)
            executed += 1
        except Exception as exc:
            if _ignorable_error(str(exc)):
                skipped += 1
                continue
            raise

    return {
        "file": file_path.name,
        "executed": executed,
        "skipped": skipped,
        "missing": False,
    }


def bootstrap_database() -> Dict:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        results = []
        for filename in SQL_FILES:
            results.append(_run_sql_file(cursor, _database_dir() / filename))

        conn.commit()

        cursor.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            """
        )
        existing_tables = {row["table_name"] for row in cursor.fetchall()}

        return {
            "message": "Bootstrap completed",
            "files": results,
            "core_tables_ready": CORE_TABLES.issubset(existing_tables),
            "table_count": len(existing_tables),
        }
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()
