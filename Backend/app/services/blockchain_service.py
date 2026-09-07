import json

from app.blockchain.blockchain import (
    Blockchain,
    Block as CoreBlock,
)

from app.db.models import Block as DBBlock


# =====================================================
# IN-MEMORY BLOCKCHAIN
# =====================================================

blockchain = Blockchain()


# =====================================================
# LOAD BLOCKCHAIN FROM POSTGRESQL
# =====================================================

def load_chain_from_db(db):
    """
    Load the complete blockchain from PostgreSQL
    into the in-memory Blockchain object.
    """

    blocks = (
        db.query(DBBlock)
        .order_by(DBBlock.index.asc())
        .all()
    )

    # Reset current in-memory chain
    blockchain.chain = []

    # -------------------------------------------------
    # No blocks in database
    # -------------------------------------------------

    if not blocks:
        blockchain.create_genesis_block()
        return blockchain

    # -------------------------------------------------
    # Rebuild blockchain from PostgreSQL
    # -------------------------------------------------

    for db_block in blocks:

        # ---------------------------------------------
        # Convert stored JSON data into Python object
        # ---------------------------------------------

        try:

            if isinstance(db_block.data, str):
                block_data = json.loads(db_block.data)

            else:
                block_data = db_block.data

        except (json.JSONDecodeError, TypeError):

            block_data = db_block.data

        # ---------------------------------------------
        # Create Core Blockchain Block
        # ---------------------------------------------

        rebuilt_block = CoreBlock(
            index=db_block.index,
            data=block_data,
            previous_hash=db_block.previous_hash,
            timestamp=db_block.timestamp,
            hash=db_block.hash,
        )

        blockchain.chain.append(rebuilt_block)

    # -------------------------------------------------
    # Safety check
    # -------------------------------------------------

    if not blockchain.chain:
        blockchain.create_genesis_block()

    return blockchain


# =====================================================
# ADD FILE TO BLOCKCHAIN + POSTGRESQL
# =====================================================

def add_file_to_chain(
    file_data: dict,
    db,
):
    """
    Add a file transaction to the blockchain
    and store the block in PostgreSQL.
    """

    # -------------------------------------------------
    # Always load latest blockchain from database
    # -------------------------------------------------

    load_chain_from_db(db)

    # -------------------------------------------------
    # Add new block
    # -------------------------------------------------

    new_block = blockchain.add_block(
        file_data
    )

    # -------------------------------------------------
    # Store block in PostgreSQL
    # -------------------------------------------------

    db_block = DBBlock(
        index=new_block.index,
        timestamp=new_block.timestamp,

        data=json.dumps(
            file_data,
            default=str,
        ),

        previous_hash=new_block.previous_hash,
        hash=new_block.hash,
    )

    db.add(db_block)

    db.commit()

    db.refresh(db_block)

    return new_block


def verify_chain(db=None):
    """
    Load blockchain from PostgreSQL and verify
    the complete cryptographic chain.
    """
    if db is not None:
        load_chain_from_db(db)
    else:
        from app.core.database import SessionLocal
        local_db = SessionLocal()
        try:
            load_chain_from_db(local_db)
        finally:
            local_db.close()

    return blockchain.is_chain_valid()


# =====================================================
# GET COMPLETE BLOCKCHAIN
# =====================================================

def get_chain(db=None):
    """
    Return the complete blockchain in a format
    suitable for the API/frontend.
    """
    if db is not None:
        load_chain_from_db(db)
    else:
        from app.core.database import SessionLocal
        local_db = SessionLocal()
        try:
            load_chain_from_db(local_db)
        finally:
            local_db.close()

    return [
        {
            "index": block.index,
            "timestamp": block.timestamp,
            "data": block.data,
            "previous_hash": block.previous_hash,
            "hash": block.hash,
        }
        for block in blockchain.chain
    ]


# =====================================================
# FIND BLOCK BY FILE HASH
# =====================================================

def find_block_by_hash(
    file_hash: str,
    db,
):
    """
    Search PostgreSQL blockchain blocks for a
    file transaction containing the specified
    SHA-256 file hash.
    """
    if not file_hash:
        return None

    target_hash = file_hash.strip().lower()

    # Get all blocks from PostgreSQL
    blocks = (
        db.query(DBBlock)
        .order_by(DBBlock.index.asc())
        .all()
    )

    for db_block in blocks:
        # 1. Parse block data
        parsed_data = None
        if isinstance(db_block.data, str):
            try:
                parsed_data = json.loads(db_block.data)
            except (json.JSONDecodeError, TypeError):
                parsed_data = db_block.data
        else:
            parsed_data = db_block.data

        # 2. Check if dictionary contains matching hash
        if isinstance(parsed_data, dict):
            stored_hash = (
                parsed_data.get("hash")
                or parsed_data.get("file_hash")
                or parsed_data.get("evidence_hash")
            )
            if stored_hash and str(stored_hash).strip().lower() == target_hash:
                return db_block

        # 3. Check if raw data string contains the exact hash
        if isinstance(db_block.data, str) and target_hash in db_block.data.lower():
            return db_block

    return None