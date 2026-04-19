"""
routers/stats.py — Dashboard statistics endpoint.

Admins receive global counts across all data.
Staff receive counts scoped to their assigned programs only.
"""

from fastapi import APIRouter, Depends
from sqlalchemy import func, cast, Float
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models import User, Program, Beneficiary, Donor, Donation, ProgramMember

router = APIRouter()


@router.get("/stats")
def get_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.is_admin:
        donation_total = db.query(func.sum(cast(Donation.amount, Float))).scalar() or 0.0

        return {
            "scope": "global",
            "total_users":          db.query(func.count(User.id)).scalar(),
            "active_programs":      db.query(func.count(Program.id)).filter(Program.status == "active").scalar(),
            "total_programs":       db.query(func.count(Program.id)).scalar(),
            "total_beneficiaries":  db.query(func.count(Beneficiary.id)).scalar(),
            "total_donors":         db.query(func.count(Donor.id)).scalar(),
            "total_donations":      db.query(func.count(Donation.id)).scalar(),
            "donation_total_usd":   round(float(donation_total), 2),
        }

    # Staff: only stats for programs they're assigned to
    assigned_ids = [
        m.program_id for m in
        db.query(ProgramMember).filter(ProgramMember.user_id == current_user.id).all()
    ]

    if not assigned_ids:
        return {
            "scope":                "personal",
            "assigned_programs":    0,
            "active_programs":      0,
            "total_beneficiaries":  0,
        }

    return {
        "scope":               "personal",
        "assigned_programs":   len(assigned_ids),
        "active_programs":     db.query(func.count(Program.id)).filter(
            Program.id.in_(assigned_ids), Program.status == "active"
        ).scalar(),
        "total_beneficiaries": db.query(func.count(Beneficiary.id)).filter(
            Beneficiary.program_id.in_(assigned_ids)
        ).scalar(),
    }
