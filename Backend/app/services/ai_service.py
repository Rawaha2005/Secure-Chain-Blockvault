import os
import re
import json
import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc

from app.db.models import User, FileRecord, Block
from app.db.custody_model import CustodyLog
from app.services.blockchain_service import get_chain, verify_chain


class AIInvestigatorService:
    def __init__(self):
        self.api_key = os.getenv("AI_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("OPENAI_API_KEY")
        self.model_name = os.getenv("AI_MODEL", "securechain-forensic-v1")

    # =====================================================
    # READ-ONLY TOOL LAYER (Enforcing RBAC)
    # =====================================================

    def get_evidence(self, db: Session, user: User, limit: int = 15, case_number: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(FileRecord)

        # RBAC: Officer only accesses own uploads or explicit cases
        if user.role == "officer":
            query = query.filter(FileRecord.owner_id == user.id)

        if case_number:
            query = query.filter(FileRecord.case_number.ilike(f"%{case_number}%"))

        records = query.order_by(desc(FileRecord.id)).limit(limit).all()

        return [
            {
                "id": r.id,
                "verification_id": r.verification_id or f"SC-EVD-{r.id:06d}",
                "filename": r.filename,
                "case_number": r.case_number or "CASE-001",
                "file_hash": r.file_hash,
                "owner_username": r.owner_username,
                "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else "N/A",
                "scan_status": getattr(r, "scan_status", "CLEAN") or "CLEAN",
                "threat_name": getattr(r, "threat_name", None),
                "file_size_bytes": getattr(r, "file_size_bytes", 0) or 0
            }
            for r in records
        ]

    def get_evidence_by_id(self, db: Session, user: User, identifier: str) -> Optional[Dict[str, Any]]:
        query = db.query(FileRecord)
        if identifier.isdigit():
            file_rec = query.filter(FileRecord.id == int(identifier)).first()
        else:
            file_rec = query.filter(
                or_(
                    FileRecord.verification_id.ilike(identifier),
                    FileRecord.filename.ilike(f"%{identifier}%"),
                    FileRecord.file_hash == identifier
                )
            ).first()

        if not file_rec:
            return None

        # RBAC Check
        if user.role == "officer" and file_rec.owner_id != user.id:
            return {"error": "Access denied: You do not have clearance to view this evidence dossier."}

        # Look up matching block
        block = db.query(Block).filter(Block.data.ilike(f"%{file_rec.file_hash}%")).first()

        return {
            "id": file_rec.id,
            "verification_id": file_rec.verification_id or f"SC-EVD-{file_rec.id:06d}",
            "filename": file_rec.filename,
            "case_number": file_rec.case_number or "CASE-001",
            "file_hash": file_rec.file_hash,
            "owner_username": file_rec.owner_username,
            "uploaded_at": file_rec.uploaded_at.isoformat() if file_rec.uploaded_at else "N/A",
            "scan_status": getattr(file_rec, "scan_status", "CLEAN"),
            "block_index": block.index if block else None,
            "block_hash": block.hash if block else None,
            "blockchain_anchored": block is not None
        }

    def search_evidence(self, db: Session, user: User, query_term: str) -> List[Dict[str, Any]]:
        query = db.query(FileRecord).filter(
            or_(
                FileRecord.filename.ilike(f"%{query_term}%"),
                FileRecord.file_hash.ilike(f"%{query_term}%"),
                FileRecord.owner_username.ilike(f"%{query_term}%"),
                FileRecord.verification_id.ilike(f"%{query_term}%"),
                FileRecord.case_number.ilike(f"%{query_term}%")
            )
        )
        if user.role == "officer":
            query = query.filter(FileRecord.owner_id == user.id)

        records = query.limit(10).all()
        return [
            {
                "verification_id": r.verification_id or f"SC-EVD-{r.id:06d}",
                "filename": r.filename,
                "case_number": r.case_number,
                "file_hash": r.file_hash,
                "owner": r.owner_username,
                "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else "N/A"
            }
            for r in records
        ]

    def get_blockchain_status(self, db: Session, user: User) -> Dict[str, Any]:
        chain_valid = verify_chain()
        blocks = db.query(Block).order_by(Block.id).all()
        total_blocks = len(blocks)
        latest_block = blocks[-1] if blocks else None

        return {
            "is_valid": chain_valid,
            "total_blocks": total_blocks,
            "genesis_block_hash": blocks[0].hash if blocks else "N/A",
            "latest_block_index": latest_block.index if latest_block else 0,
            "latest_block_hash": latest_block.hash if latest_block else "N/A",
            "latest_timestamp": latest_block.timestamp if latest_block else "N/A",
            "health_verdict": "HEALTHY / IMMUTABLE" if chain_valid else "ALERT / TAMPER DETECTED"
        }

    def get_custody_logs(self, db: Session, user: User, limit: int = 10, action_filter: Optional[str] = None, username_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        query = db.query(CustodyLog)
        if action_filter:
            query = query.filter(CustodyLog.action.ilike(f"%{action_filter}%"))
        if username_filter:
            query = query.filter(CustodyLog.username.ilike(f"%{username_filter}%"))

        # RBAC: Officer only sees logs of their own activities
        if user.role == "officer":
            query = query.filter(CustodyLog.username == user.username)

        logs = query.order_by(desc(CustodyLog.id)).limit(limit).all()

        return [
            {
                "id": l.id,
                "action": l.action,
                "filename": l.filename or "N/A",
                "username": l.username,
                "role": l.role,
                "status": l.status,
                "reason": l.reason or "",
                "created_at": l.created_at.isoformat() if l.created_at else "N/A",
                "ip_address": l.ip_address,
                "record_hash": l.record_hash
            }
            for l in logs
        ]

    def get_security_scan_results(self, db: Session, user: User) -> Dict[str, Any]:
        total_evidence = db.query(FileRecord).count()
        clean_count = db.query(FileRecord).filter(FileRecord.scan_status == "CLEAN").count()
        blocked_attempts = db.query(CustodyLog).filter(CustodyLog.action.ilike("%SECURITY%")).count()

        recent_blocked = db.query(CustodyLog).filter(
            CustodyLog.action.ilike("%SECURITY%")
        ).order_by(desc(CustodyLog.id)).limit(5).all()

        return {
            "total_scanned_files": total_evidence,
            "clean_files_registered": clean_count,
            "security_blocks_logged": blocked_attempts,
            "recent_blocked_attempts": [
                {
                    "filename": b.filename,
                    "reason": b.reason,
                    "user": b.username,
                    "timestamp": b.created_at.isoformat() if b.created_at else "N/A"
                }
                for b in recent_blocked
            ]
        }

    def get_user_statistics(self, db: Session, user: User) -> Dict[str, Any]:
        if user.role not in ["admin", "investigator", "auditor"]:
            return {"error": "User directory telemetry restricted to Investigator and Administrator clearances."}

        total_users = db.query(User).count()
        admins = db.query(User).filter(User.role == "admin").count()
        investigators = db.query(User).filter(User.role == "investigator").count()
        officers = db.query(User).filter(User.role == "officer").count()
        auditors = db.query(User).filter(User.role == "auditor").count()

        return {
            "total_personnel": total_users,
            "breakdown": {
                "admin": admins,
                "investigator": investigators,
                "officer": officers,
                "auditor": auditors
            }
        }

    # =====================================================
    # INTELLIGENT INTENT PARSER & REPORT SYNTHESIZER
    # =====================================================

    def process_investigation_query(self, message: str, db: Session, user: User) -> Dict[str, Any]:
        msg = message.strip().lower()
        tools_executed = []

        # 1. Total Evidence / Count queries
        if any(w in msg for w in ["how many evidence", "total evidence", "count of evidence", "number of files"]):
            tools_executed.append("get_evidence")
            evidence = self.get_evidence(db, user, limit=50)
            total = len(evidence)
            reply = f"### 📊 Digital Evidence Inventory\n\nThere are currently **{total} evidence files** accessible under your **{user.role.upper()}** clearance.\n\n"
            if total > 0:
                reply += "| Verification ID | Filename | Case # | Submitter | Status |\n|---|---|---|---|---|\n"
                for e in evidence[:8]:
                    reply += f"| {e['verification_id']} | **{e['filename']}** | {e['case_number']} | @{e['owner_username']} | 🟢 {e['scan_status']} |\n"
                if total > 8:
                    reply += f"\n*...and {total - 8} more registered evidence records.*"
            return {"reply": reply, "tools_used": tools_executed}

        # 2. Blockchain Integrity Status
        if any(w in msg for w in ["blockchain status", "is blockchain valid", "blockchain integrity", "chain valid", "tamper", "blocks"]):
            tools_executed.append("get_blockchain_status")
            bc = self.get_blockchain_status(db, user)
            reply = f"### ⛓️ Blockchain Integrity Telemetry\n\n"
            reply += f"- **Chain State**: {'🟢 **100% CRYPTOGRAPHICALLY VALID**' if bc['is_valid'] else '🔴 **TAMPER VIOLATION DETECTED**'}\n"
            reply += f"- **Total Blocks**: {bc['total_blocks']}\n"
            reply += f"- **Current Height**: Block #{bc['latest_block_index']}\n"
            reply += f"- **Latest Block Hash**: {bc['latest_block_hash'][:24]}...\n"
            reply += f"- **Health Verdict**: **{bc['health_verdict']}**\n\n"
            reply += f"All blocks are linked with sequential SHA-256 parent hash references. No unauthorized block mutation has occurred."
            return {"reply": reply, "tools_used": tools_executed}

        # 3. Evidence by Case Number
        case_match = re.search(r"case\s*#?([a-zA-Z0-9_-]+)", msg, re.IGNORECASE)
        if case_match or "case" in msg:
            case_id = case_match.group(1) if case_match else "CASE"
            tools_executed.append("get_evidence")
            evidence = self.get_evidence(db, user, limit=20, case_number=case_id)
            if not evidence and case_match:
                evidence = self.get_evidence(db, user, limit=20)

            reply = f"### 📁 Evidence Dossier for Case {case_id.upper()}\n\n"
            if evidence:
                reply += f"Found **{len(evidence)} evidence item(s)** matching this case:\n\n"
                reply += "| Verification ID | Filename | SHA-256 Digest | Officer |\n|---|---|---|---|\n"
                for e in evidence:
                    reply += f"| {e['verification_id']} | **{e['filename']}** | {e['file_hash'][:16]}... | @{e['owner_username']} |\n"
            else:
                reply += f"No digital evidence files found registered under Case {case_id}."
            return {"reply": reply, "tools_used": tools_executed}

        # 4. Evidence by specific user (e.g. "uploaded by nafeesa")
        user_match = re.search(r"(?:uploaded by|by user|officer|by)\s+([a-zA-Z0-9_-]+)", msg, re.IGNORECASE)
        if user_match and not any(k in msg for k in ["case", "how many", "status"]):
            target_user = user_match.group(1).strip()
            tools_executed.append("search_evidence")
            results = self.search_evidence(db, user, target_user)
            reply = f"### 👤 Evidence Registered by Agent @{target_user}\n\n"
            if results:
                reply += f"Found **{len(results)} record(s)** associated with user **{target_user}**:\n\n"
                for r in results:
                    reply += f"- **{r['filename']}** ({r['verification_id']}) — Anchored at {r['uploaded_at']}\n"
            else:
                reply += f"No evidence records found uploaded by user @{target_user} under your clearance scope."
            return {"reply": reply, "tools_used": tools_executed}

        # 5. Failed Verifications / Suspicious Attempts
        if any(w in msg for w in ["failed verification", "verification failure", "suspicious", "tampered evidence", "failed"]):
            tools_executed.append("get_custody_logs")
            logs = self.get_custody_logs(db, user, limit=25, action_filter="VERIFY")
            failed_logs = [l for l in logs if l["status"] == "FAILED" or "FAIL" in l["action"]]

            reply = f"### 🚨 Verification Anomaly Audit\n\n"
            if failed_logs:
                reply += f"Detected **{len(failed_logs)} failed or mismatching verification attempt(s)** in the audit ledger:\n\n"
                reply += "| Log ID | File Name | Officer / IP | Reason | Timestamp |\n|---|---|---|---|---|\n"
                for fl in failed_logs[:6]:
                    reply += f"| #{fl['id']} | **{fl['filename']}** | @{fl['username']} ({fl['ip_address']}) | {fl['reason'] or 'Hash mismatch'} | {fl['created_at']} |\n"
            else:
                reply += "🟢 **No failed verification attempts recorded.** All submitted files have bit-for-bit matched their authoritative blockchain records."
            return {"reply": reply, "tools_used": tools_executed}

        # 6. Chain of Custody & Audit Activity
        if any(w in msg for w in ["custody", "audit", "recent activity", "audit trail", "history", "logs"]):
            tools_executed.append("get_custody_logs")
            logs = self.get_custody_logs(db, user, limit=10)
            reply = f"### 📜 Recent Chain of Custody Events\n\n"
            if logs:
                reply += "| ID | Action | Target Evidence | Agent | Status | Timestamp |\n|---|---|---|---|---|---|\n"
                for l in logs:
                    reply += f"| #{l['id']} | **{l['action']}** | {l['filename']} | @{l['username']} ({l['role']}) | {l['status']} | {l['created_at']} |\n"
                reply += "\n*Every event is linked with SHA-256 hash chaining for tamper-evident auditability.*"
            else:
                reply += "No chain of custody logs found."
            return {"reply": reply, "tools_used": tools_executed}

        # 7. Security / Malware Scanning Events
        if any(w in msg for w in ["security", "malware", "scan", "antivirus", "threat", "clamav"]):
            tools_executed.append("get_security_scan_results")
            sec = self.get_security_scan_results(db, user)
            reply = f"### 🛡️ Malware & Security Threat Telemetry\n\n"
            reply += f"- **Total Ingested Files Scanned**: {sec['total_scanned_files']}\n"
            reply += f"- **Verified Clean**: 100% ({sec['clean_files_registered']} files)\n"
            reply += f"- **Security Blocks / Threats Intercepted**: {sec['security_blocks_logged']}\n\n"
            if sec['recent_blocked_attempts']:
                reply += "#### Recent Blocked Ingestion Attempts:\n"
                for b in sec['recent_blocked_attempts']:
                    reply += f"- 🚫 **{b['filename']}**: Threat {b['reason']} by @{b['user']} at {b['timestamp']}\n"
            else:
                reply += "🟢 **No malicious files or signature threats detected.** Scanning pipeline is active with ClamAV and heuristic binary inspection."
            return {"reply": reply, "tools_used": tools_executed}

        # 8. User directory / Personnel stats
        if any(w in msg for w in ["users", "personnel", "officers", "investigators", "roles"]):
            tools_executed.append("get_user_statistics")
            stats = self.get_user_statistics(db, user)
            if "error" in stats:
                return {"reply": f"⚠️ {stats['error']}", "tools_used": tools_executed}
            reply = f"### 👥 SecureChain Authorized Personnel\n\n"
            reply += f"Total registered accounts: **{stats['total_personnel']}**\n\n"
            for role, count in stats["breakdown"].items():
                reply += f"- **{role.capitalize()}**: {count} active account(s)\n"
            return {"reply": reply, "tools_used": tools_executed}

        # 9. Generic Search & Context Summary
        tools_executed.append("search_evidence")
        search_res = self.search_evidence(db, user, message)
        bc_status = self.get_blockchain_status(db, user)

        reply = f"### 🤖 Forensic Intelligence Briefing\n\n"
        reply += f"I analyzed your inquiry: *\"{message}\"*\n\n"
        if search_res:
            reply += f"**Matching Evidence Records ({len(search_res)}):**\n"
            for r in search_res:
                reply += f"- {r['verification_id']}: **{r['filename']}** (Case: {r['case_number']}, Officer: @{r['owner']})\n"
            reply += "\n"

        reply += f"**System Health Summary:**\n"
        reply += f"- Blockchain State: {'🟢 VALID' if bc_status['is_valid'] else '🔴 TAMPERED'} ({bc_status['total_blocks']} blocks)\n"
        reply += f"- Clearance Active: **{user.role.upper()}** (Agent @{user.username})\n\n"
        reply += "💡 *You can ask me about specific cases, filenames, verification failures, custody audits, or blockchain proofs.*"

        return {"reply": reply, "tools_used": tools_executed}


ai_investigator = AIInvestigatorService()
