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

    def calculate_hash(self, compact: bool = True):
        block_data = {
            "index": self.index,
            "timestamp": self.timestamp,
            "data": self.data,
            "previous_hash": self.previous_hash,
        }
        if compact:
            block_string = json.dumps(
                block_data,
                sort_keys=True,
                separators=(",", ":"),
                default=str,
            ).encode("utf-8")
        else:
            block_string = json.dumps(
                block_data,
                sort_keys=True,
                default=str,
            ).encode("utf-8")
        return hashlib.sha256(block_string).hexdigest()

    def matches_hash(self, expected_hash: str) -> bool:
        if not expected_hash:
            return False
        return expected_hash in (
            self.calculate_hash(compact=True),
            self.calculate_hash(compact=False),
        )
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

        start_idx = 1
        if self.chain[0].index == 0:
            if self.chain[0].previous_hash != "0":
                return False
            if not self.chain[0].matches_hash(self.chain[0].hash):
                return False
        elif self.chain[0].index == 1:
            if not self.chain[0].matches_hash(self.chain[0].hash):
                return False

        for i in range(start_idx, len(self.chain)):
            current_block = self.chain[i]
            previous_block = self.chain[i - 1]

            if current_block.index != previous_block.index + 1:
                return False

            if not current_block.matches_hash(current_block.hash):
                return False

            if current_block.previous_hash != previous_block.hash:
                return False

        return True
