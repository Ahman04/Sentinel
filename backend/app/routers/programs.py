"""
programs.py — CRUD endpoints for NGO programs.

Programs represent initiatives the NGO runs (e.g. "Food Aid 2025").
Only admins can create, update, or delete programs.
Any authenticated user can view programs they are assigned to.
Admins see all programs.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Program, ProgramMember, User
from app.schemas import ProgramCreate, ProgramUpdate, ProgramResponse, AddMemberPayload, ProgramMemberResponse
from app.dependencies import get_current_user, require_admin

router = APIRouter()


def _to_response(program: Program) -> ProgramResponse:
    """Map a Program ORM object to a ProgramResponse, including member count."""
    return ProgramResponse(
        id=program.id,
        name=program.name,
        description=program.description,
        status=program.status,
        start_date=program.start_date,
        created_at=program.created_at,
        member_count=len(program.members),
    )


# ---------------------------------------------------------------------------
# GET /programs — list all programs (admin) or assigned programs (others)
# ---------------------------------------------------------------------------

@router.get("", response_model=list[ProgramResponse])
def list_programs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.is_admin:
        programs = db.query(Program).order_by(Program.created_at.desc()).all()
    else:
        # Non-admins only see programs they are assigned to
        memberships = db.query(ProgramMember).filter_by(user_id=current_user.id).all()
        program_ids = [m.program_id for m in memberships]
        programs = db.query(Program).filter(Program.id.in_(program_ids)).all()
    return [_to_response(p) for p in programs]


# ---------------------------------------------------------------------------
# POST /programs — create a program (admin only)
# ---------------------------------------------------------------------------

@router.post("", response_model=ProgramResponse, status_code=201)
def create_program(
    payload: ProgramCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    program = Program(**payload.model_dump())
    db.add(program)
    db.commit()
    db.refresh(program)
    return _to_response(program)


# ---------------------------------------------------------------------------
# GET /programs/{id} — get a single program
# ---------------------------------------------------------------------------

@router.get("/{program_id}", response_model=ProgramResponse)
def get_program(
    program_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = db.query(Program).filter_by(id=program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    # Non-admins can only view programs they belong to
    if not current_user.is_admin:
        member = db.query(ProgramMember).filter_by(
            program_id=program_id, user_id=current_user.id
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Access denied")

    return _to_response(program)


# ---------------------------------------------------------------------------
# PUT /programs/{id} — update a program (admin only)
# ---------------------------------------------------------------------------

@router.put("/{program_id}", response_model=ProgramResponse)
def update_program(
    program_id: uuid.UUID,
    payload: ProgramUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    program = db.query(Program).filter_by(id=program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(program, field, value)

    db.commit()
    db.refresh(program)
    return _to_response(program)


# ---------------------------------------------------------------------------
# DELETE /programs/{id} — delete a program (admin only)
# ---------------------------------------------------------------------------

@router.delete("/{program_id}", status_code=204)
def delete_program(
    program_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    program = db.query(Program).filter_by(id=program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    db.delete(program)
    db.commit()


# ---------------------------------------------------------------------------
# GET /programs/{id}/members — list members of a program
# ---------------------------------------------------------------------------

@router.get("/{program_id}/members", response_model=list[ProgramMemberResponse])
def list_members(
    program_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    program = db.query(Program).filter_by(id=program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    members = db.query(ProgramMember).filter_by(program_id=program_id).all()
    result = []
    for m in members:
        user = db.query(User).filter_by(id=m.user_id).first()
        if user:
            result.append(ProgramMemberResponse(
                user_id=m.user_id,
                full_name=user.full_name,
                email=user.email,
                role=m.role,
                joined_at=m.joined_at,
            ))
    return result


# ---------------------------------------------------------------------------
# POST /programs/{id}/members — add a member (admin only)
# ---------------------------------------------------------------------------

@router.post("/{program_id}/members", status_code=201)
def add_member(
    program_id: uuid.UUID,
    payload: AddMemberPayload,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    program = db.query(Program).filter_by(id=program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")

    user = db.query(User).filter_by(id=payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(ProgramMember).filter_by(
        program_id=program_id, user_id=payload.user_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = ProgramMember(program_id=program_id, user_id=payload.user_id, role=payload.role)
    db.add(member)
    db.commit()
    return {"message": "Member added"}


# ---------------------------------------------------------------------------
# DELETE /programs/{id}/members/{user_id} — remove a member (admin only)
# ---------------------------------------------------------------------------

@router.delete("/{program_id}/members/{user_id}", status_code=204)
def remove_member(
    program_id: uuid.UUID,
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    member = db.query(ProgramMember).filter_by(
        program_id=program_id, user_id=user_id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
