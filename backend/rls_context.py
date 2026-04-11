"""
Contexto RLS para PostgreSQL al estilo Supabase (auth.jwt() -> request.jwt.claims).

Las policies que usan auth.jwt()->>'tenant_id' y auth.jwt()->>'rol' leen el JSON
configurado con set_config(..., true) en la transacción actual. SET LOCAL ROLE
authenticated hace que se apliquen las policies definidas para ese rol.
"""
from __future__ import annotations

import json
import logging
import os
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator, Dict, Mapping

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

ENABLE_DB_RLS_CONTEXT = os.environ.get("ENABLE_DB_RLS_CONTEXT", "1").strip().lower() in (
    "1",
    "true",
    "yes",
    "on",
)


def jwt_payload_to_rls_claims(payload: Mapping[str, Any]) -> Dict[str, str]:
    """Traduce el JWT decodificado de la app a claims que expone auth.jwt() en Postgres."""
    sub = payload.get("sub")
    if sub is None:
        raise ValueError("JWT payload missing sub")
    return {
        "sub": str(sub),
        "role": "authenticated",
        "tenant_id": str(payload.get("tenant_id", "")),
        "rol": str(payload.get("rol", "")),
    }


async def apply_rls_context(session: AsyncSession, payload: Mapping[str, Any]) -> None:
    """
    Aplica claims JWT y rol de sesión en la transacción actual (equivalente a SET LOCAL).

    Debe ejecutarse antes del primer SELECT/INSERT/UPDATE/DELETE que deba verse
    restringido por RLS. No sustituye validaciones en la API (require_admin, etc.).
    """
    if not ENABLE_DB_RLS_CONTEXT:
        return
    claims = jwt_payload_to_rls_claims(payload)
    claims_json = json.dumps(claims, separators=(",", ":"))
    await session.execute(
        text("SELECT set_config('request.jwt.claims', :claims, true)"),
        {"claims": claims_json},
    )
    await session.execute(text("SET LOCAL ROLE authenticated"))


@asynccontextmanager
async def authenticated_rls(
    session: AsyncSession, payload: Mapping[str, Any]
) -> AsyncIterator[AsyncSession]:
    """Aplica el contexto RLS y cede la misma sesión para operaciones subsiguientes."""
    await apply_rls_context(session, payload)
    yield session
