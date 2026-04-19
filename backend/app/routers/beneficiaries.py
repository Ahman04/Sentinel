"""
beneficiaries.py — CRUD endpoints for program beneficiaries.

Beneficiaries are people receiving services from a program.
- Admins can create, update, delete, and list beneficiaries for any program.
- Field staff (assigned to the program) can create and view beneficiaries in their program.
- Non-members of a program cannot access that program's beneficiaries.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Beneficiary, Program, ProgramMember, User
from app.schemas import BeneficiaryCreate, BeneficiaryUpdate, BeneficiaryResponse
from app.dependencies import get_current_user

router = APIRouter()


def _check_program_access(program_id: uuid.UUID, current_user: User, db: Session):
    """
    Raise 404 if program doesn't exist.
    Raise 403 if the current user is not an admin and not assigned to the program.
    Returns the program on success.
    """
    program = db.query(Program).filter_by(id=program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    if not current_user.is_admin:
        member = db.query(ProgramMember).filter_by(
            program_id=program_id, user_id=current_user.id
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Access denied")

    return program


# ---------------------------------------------------------------------------
# GET /programs/{program_id}/beneficiaries — list beneficiaries
# ---------------------------------------------------------------------------

@router.get("/{program_id}/beneficiaries", response_model=list[BeneficiaryResponse])
def list_beneficiaries(
    program_id: uuid.UUID,
    search: Optional[str] = Query(None, description="Filter by name or location"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all beneficiaries for a program. Supports optional name/location search."""
    _check_program_access(program_id, current_user, db)

    query = db.query(Beneficiary).filter_by(program_id=program_id)

    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Beneficiary.full_name.ilike(term) | Beneficiary.location.ilike(term)
        )

    return query.order_by(Beneficiary.created_at.desc()).all()


# ---------------------------------------------------------------------------
# POST /programs/{program_id}/beneficiaries — register a beneficiary
# ---------------------------------------------------------------------------

@router.post("/{program_id}/beneficiaries", response_model=BeneficiaryResponse, status_code=201)
def create_beneficiary(
    program_id: uuid.UUID,
    payload: BeneficiaryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register a new beneficiary under a program. Any assigned staff member can do this."""
    _check_program_access(program_id, current_user, db)

    beneficiary = Beneficiary(program_id=program_id, **payload.model_dump())
    db.add(beneficiary)
    db.commit()
    db.refresh(beneficiary)
    return beneficiary


# ---------------------------------------------------------------------------
# GET /programs/{program_id}/beneficiaries/{id} — get one beneficiary
# ---------------------------------------------------------------------------

@router.get("/{program_id}/beneficiaries/{beneficiary_id}", response_model=BeneficiaryResponse)
def get_beneficiary(
    program_id: uuid.UUID,
    beneficiary_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _check_program_access(program_id, current_user, db)

    b = db.query(Beneficiary).filter_by(id=beneficiary_id, program_id=program_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Beneficiary not found")
    return b


# ---------------------------------------------------------------------------
# PUT /programs/{program_id}/beneficiaries/{id} — update a beneficiary
# ---------------------------------------------------------------------------

@router.put("/{program_id}/beneficiaries/{beneficiary_id}", response_model=BeneficiaryResponse)
def update_beneficiary(
    program_id: uuid.UUID,
    beneficiary_id: uuid.UUID,
    payload: BeneficiaryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update beneficiary details. Any assigned staff member can edit."""
    _check_program_access(program_id, current_user, db)

    b = db.query(Beneficiary).filter_by(id=beneficiary_id, program_id=program_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Beneficiary not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(b, field, value)

    db.commit()
    db.refresh(b)
    return b


# ---------------------------------------------------------------------------
# DELETE /programs/{program_id}/beneficiaries/{id} — delete (admin only)
# ---------------------------------------------------------------------------

@router.delete("/{program_id}/beneficiaries/{beneficiary_id}", status_code=204)
def delete_beneficiary(
    program_id: uuid.UUID,
    beneficiary_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a beneficiary record. Admin only."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")

    _check_program_access(program_id, current_user, db)

    b = db.query(Beneficiary).filter_by(id=beneficiary_id, program_id=program_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Beneficiary not found")

    db.delete(b)
    db.commit()
