from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from app.core.database import get_db

from app.services.blockchain_service import (
    add_file_to_chain,
    get_chain,
    verify_chain
)


router = APIRouter(
    prefix="/blockchain",
    tags=["Blockchain"]
)


# =====================================================
# ADD BLOCK
# =====================================================

@router.post("/add")

def add_block(
    data: dict,
    db: Session = Depends(get_db)
):

    block = add_file_to_chain(
        data,
        db
    )

    return {

        "message": "Block added successfully",

        "index": block.index,

        "timestamp": block.timestamp,

        "previous_hash": block.previous_hash,

        "hash": block.hash
    }


# =====================================================
# GET COMPLETE BLOCKCHAIN
# =====================================================

@router.get("/chain")

def get_full_chain(
    db: Session = Depends(get_db)
):

    chain = get_chain(db)

    return {

        "total_blocks": len(chain),

        "chain": chain
    }


# =====================================================
# VERIFY BLOCKCHAIN
# =====================================================

@router.get("/verify")

def verify(
    db: Session = Depends(get_db)
):

    is_valid = verify_chain(db)

    return {

        "valid": is_valid,

        "message": (
            "Blockchain is valid."
            if is_valid
            else
            "Blockchain integrity has been compromised."
        )
    }