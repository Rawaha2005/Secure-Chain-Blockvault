import hashlib
import json
from datetime import datetime


# =====================================================
# BLOCK
# =====================================================

class Block:

    def __init__(
        self,
        index,
        data,
        previous_hash,
        timestamp=None,
        hash=None,
    ):
        self.index = index

        self.timestamp = (
            timestamp
            if timestamp is not None
            else datetime.utcnow().isoformat()
        )

        self.data = data

        self.previous_hash = previous_hash

        self.hash = (
            hash
            if hash is not None
            else self.calculate_hash()
        )

    # =================================================
    # CALCULATE BLOCK HASH
    # =================================================

    def calculate_hash(self):

        block_data = {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
        }

        block_string = json.dumps(
            block_data,
            sort_keys=True,
            separators=(",", ":"),
            default=str,
        ).encode("utf-8")

        return hashlib.sha256(
            block_string
        ).hexdigest()


# =====================================================
# BLOCKCHAIN
# =====================================================

class Blockchain:

    def __init__(self):

        self.chain = []

        self.create_genesis_block()

    # =================================================
    # CREATE GENESIS BLOCK
    # =================================================

    def create_genesis_block(self):

        genesis = Block(
            index=0,
            data="Genesis Block",
            previous_hash="0",
        )

        self.chain.append(genesis)

        return genesis

    # =================================================
    # GET LAST BLOCK
    # =================================================

    def get_last_block(self):

        if not self.chain:

            return self.create_genesis_block()

        return self.chain[-1]

    # =================================================
    # ADD BLOCK
    # =================================================

    def add_block(self, data):

        last_block = self.get_last_block()

        new_index = last_block.index + 1

        new_block = Block(
            index=new_index,
            data=data,
            previous_hash=last_block.hash,
        )

        self.chain.append(new_block)

        return new_block

    # =================================================
    # VALIDATE BLOCKCHAIN
    # =================================================

    def is_chain_valid(self):

        if not self.chain:

            return False

        # ---------------------------------------------
        # Validate genesis block
        # ---------------------------------------------

        genesis = self.chain[0]

        if genesis.index != 0:

            return False

        if genesis.previous_hash != "0":

            return False

        # ---------------------------------------------
        # Validate every block
        # ---------------------------------------------

        for i in range(1, len(self.chain)):

            current_block = self.chain[i]

            previous_block = self.chain[i - 1]

            # -----------------------------------------
            # Validate block index
            # -----------------------------------------

            if current_block.index != previous_block.index + 1:

                return False

            # -----------------------------------------
            # Validate current block hash
            # -----------------------------------------

            if (
                current_block.hash
                != current_block.calculate_hash()
            ):

                return False

            # -----------------------------------------
            # Validate previous hash linkage
            # -----------------------------------------

            if (
                current_block.previous_hash
                != previous_block.hash
            ):

                return False

        return True