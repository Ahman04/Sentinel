"""
donors.py — CRUD endpoints for donors and their donations.

All donor endpoints are restricted to admin users.
Donors represent individuals or organisations that fund NGO programs.
Each donor can have multiple donation records, optionally linked to a program.
"""

import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import Donor, Donation
from app.schemas import (
    DonorCreate, DonorUpdate, DonorResponse,
    DonationCreate, DonationResponse,
)
from app.dependencies import require_admin

router = APIRouter()


def _donor_response(donor: Donor) -> DonorResponse:
    """Map Donor ORM to DonorResponse, including computed donation count."""
    return DonorResponse(
        id=donor.id,
        full_name=donor.full_name,
        email=donor.email,
        phone=donor.phone,
        organization=donor.organization,
        notes=donor.notes,
        created_at=donor.created_at,
        donation_count=len(donor.donations),
    )


# ---------------------------------------------------------------------------
# GET /donors — list all donors (admin only)
# ---------------------------------------------------------------------------

@router.get("", response_model=list[DonorResponse])
def list_donors(
    search: Optional[str] = Query(None, description="Filter by name or organisation"),
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    """List all donors. Supports optional name/organisation search."""
    query = db.query(Donor)
    if search:
        term = f"%{search.lower()}%"
        query = query.filter(
            Donor.full_name.ilike(term) | Donor.organization.ilike(term)
        )
    donors = query.order_by(Donor.created_at.desc()).all()
    return [_donor_response(d) for d in donors]


# ---------------------------------------------------------------------------
# POST /donors — register a new donor (admin only)
# ---------------------------------------------------------------------------

@router.post("", response_model=DonorResponse, status_code=201)
def create_donor(
    payload: DonorCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    donor = Donor(**payload.model_dump())
    db.add(donor)
    db.commit()
    db.refresh(donor)
    return _donor_response(donor)


# ---------------------------------------------------------------------------
# GET /donors/{id} — get one donor (admin only)
# ---------------------------------------------------------------------------

@router.get("/{donor_id}", response_model=DonorResponse)
def get_donor(
    donor_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    donor = db.query(Donor).filter_by(id=donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    return _donor_response(donor)


# ---------------------------------------------------------------------------
# PUT /donors/{id} — update a donor (admin only)
# ---------------------------------------------------------------------------

@router.put("/{donor_id}", response_model=DonorResponse)
def update_donor(
    donor_id: uuid.UUID,
    payload: DonorUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    donor = db.query(Donor).filter_by(id=donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(donor, field, value)

    db.commit()
    db.refresh(donor)
    return _donor_response(donor)


# ---------------------------------------------------------------------------
# DELETE /donors/{id} — delete a donor (admin only)
# ---------------------------------------------------------------------------

@router.delete("/{donor_id}", status_code=204)
def delete_donor(
    donor_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    donor = db.query(Donor).filter_by(id=donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    db.delete(donor)
    db.commit()


# ---------------------------------------------------------------------------
# GET /donors/{id}/donations — list all donations by a donor (admin only)
# ---------------------------------------------------------------------------

@router.get("/{donor_id}/donations", response_model=list[DonationResponse])
def list_donations(
    donor_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    donor = db.query(Donor).filter_by(id=donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    return db.query(Donation).filter_by(donor_id=donor_id).order_by(Donation.created_at.desc()).all()


# ---------------------------------------------------------------------------
# POST /donors/{id}/donations — record a donation (admin only)
# ---------------------------------------------------------------------------

@router.post("/{donor_id}/donations", response_model=DonationResponse, status_code=201)
def create_donation(
    donor_id: uuid.UUID,
    payload: DonationCreate,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    donor = db.query(Donor).filter_by(id=donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    donation = Donation(donor_id=donor_id, **payload.model_dump())
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


# ---------------------------------------------------------------------------
# DELETE /donors/{id}/donations/{donation_id} — remove a donation (admin only)
# ---------------------------------------------------------------------------

@router.delete("/{donor_id}/donations/{donation_id}", status_code=204)
def delete_donation(
    donor_id: uuid.UUID,
    donation_id: uuid.UUID,
    db: Session = Depends(get_db),
    _=Depends(require_admin),
):
    donation = db.query(Donation).filter_by(id=donation_id, donor_id=donor_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    db.delete(donation)
    db.commit()
