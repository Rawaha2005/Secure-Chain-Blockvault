import { useState, useEffect } from "react";
import api from "../api/api";
import PageHeader from "../components/ui/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import StatusBadge from "../components/common/StatusBadge";
import Modal from "../components/ui/Modal";
import RegisterModal from "../components/auth/RegisterModal";
import { LoadingSpinner } from "../components/ui/Loading";
import {
  FaUsersCog,
  FaUserPlus,
  FaUserShield,
  FaUserEdit,
  FaTrashAlt,
  FaShieldAlt,
  FaLock,
  FaCheck,
  FaTimes,
  FaSync,
} from "react-icons/fa";
import toast from "react-hot-toast";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [deletingUser, setDeletingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data?.users || []);
    } catch (err) {
      toast.error("Failed to load user personnel records.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    if (!editingUser || !selectedRole) return;

    try {
      setActionLoading(true);
      await api.put(`/admin/users/${editingUser.id}/role`, {
        role: selectedRole,
      });
      toast.success(`Role updated to ${selectedRole.toUpperCase()} for ${editingUser.username}`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update role.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setActionLoading(true);
      await api.delete(`/admin/users/${deletingUser.id}`);
      toast.success(`Agent ${deletingUser.username} removed from system.`);
      setDeletingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.username?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.role?.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (roleFilter === "all") return true;
    return u.role?.toLowerCase() === roleFilter.toLowerCase();
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Personnel & Access Control (RBAC)"
        subtitle="Manage authorized SOC personnel, security clearance levels, and role-based cryptographic access permissions."
        breadcrumb="PERSONNEL"
        badge="ADMIN ONLY"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={fetchUsers}
              className="p-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:text-white transition"
              title="Refresh Personnel"
            >
              <FaSync className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="cyber-btn text-xs py-2.5 px-4 flex items-center gap-2 font-bold"
            >
              <FaUserPlus /> Enlist New Agent
            </button>
          </div>
        }
      />

      {/* Search Toolbar */}
      <div className="glass-card p-4 border-slate-800/80">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search by agent username, email, or role..."
          filterOptions={[
            { label: "All Personnel", value: "all" },
            { label: "Admins", value: "admin" },
            { label: "Investigators", value: "investigator" },
            { label: "Officers", value: "officer" },
            { label: "Auditors", value: "auditor" },
          ]}
          activeFilter={roleFilter}
          onFilterChange={setRoleFilter}
        />
      </div>

      {/* Users Table */}
      <div className="glass-card p-6 border-slate-800/80">
        {loading ? (
          <LoadingSpinner text="Retrieving Personnel Clearance Directory..." />
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-400 font-mono">No personnel records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">ID</th>
                  <th className="pb-3 font-semibold">AGENT USERNAME</th>
                  <th className="pb-3 font-semibold">OFFICIAL EMAIL</th>
                  <th className="pb-3 font-semibold">SECURITY CLEARANCE</th>
                  <th className="pb-3 font-semibold hidden md:table-cell">ENLISTED DATE</th>
                  <th className="pb-3 font-semibold text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((userRecord) => (
                  <tr key={userRecord.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-4 text-cyan-400 font-bold">#{userRecord.id}</td>
                    <td className="py-4">
                      <div className="font-semibold text-white text-sm flex items-center gap-2 font-sans">
                        <FaUserShield className="text-cyan-400 text-xs" />
                        {userRecord.username}
                      </div>
                    </td>
                    <td className="py-4 text-slate-300">{userRecord.email}</td>
                    <td className="py-4">
                      <StatusBadge status={userRecord.role} />
                    </td>
                    <td className="py-4 text-slate-400 hidden md:table-cell">
                      {userRecord.created_at ? new Date(userRecord.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit Role Button */}
                        <button
                          onClick={() => {
                            setEditingUser(userRecord);
                            setSelectedRole(userRecord.role);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                          title="Modify Clearance Level"
                        >
                          <FaUserEdit className="text-sm" />
                        </button>

                        {/* Delete User Button */}
                        <button
                          onClick={() => setDeletingUser(userRecord)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Revoke & Delete Account"
                        >
                          <FaTrashAlt className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permissions Matrix Card */}
      <div className="glass-card p-6 border-slate-800/80 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <FaLock className="text-cyan-400" />
          SOC Role-Based Access Control (RBAC) Permission Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2.5">PERMISSION ACTION</th>
                <th className="pb-2.5 text-center text-purple-400">ADMIN</th>
                <th className="pb-2.5 text-center text-blue-400">INVESTIGATOR</th>
                <th className="pb-2.5 text-center text-cyan-400">OFFICER</th>
                <th className="pb-2.5 text-center text-emerald-400">AUDITOR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 font-sans">Evidence Ingestion / Upload</td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-rose-400"><FaTimes className="mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans">Evidence Decrypt & Download</td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-amber-400">Own Only</td>
                <td className="text-center text-rose-400"><FaTimes className="mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans">Evidence Integrity Verification</td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans">Chain of Custody & Audit Inspection</td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-amber-400">Own Only</td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans">Personnel Management & Role Assignment</td>
                <td className="text-center text-emerald-400"><FaCheck className="mx-auto" /></td>
                <td className="text-center text-rose-400"><FaTimes className="mx-auto" /></td>
                <td className="text-center text-rose-400"><FaTimes className="mx-auto" /></td>
                <td className="text-center text-rose-400"><FaTimes className="mx-auto" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Modify Clearance Level"
        subtitle={`AGENT: ${editingUser?.username} (ID: #${editingUser?.id})`}
      >
        <form onSubmit={handleUpdateRole} className="space-y-5">
          <p className="text-xs text-slate-400 font-mono">
            Select the new role and cryptographic access clearance for this operative:
          </p>

          <div className="space-y-2.5">
            {[
              { role: "admin", label: "System Administrator", desc: "Full root authority, personnel RBAC, all files" },
              { role: "investigator", label: "Lead Investigator", desc: "Evidence download, custody analysis, verification" },
              { role: "officer", label: "Field Officer", desc: "Evidence ingestion and owner-level access" },
              { role: "auditor", label: "Independent Auditor", desc: "Read-only custody inspection & verification" },
            ].map((opt) => (
              <label
                key={opt.role}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                  selectedRole === opt.role
                    ? "bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm font-sans">{opt.label}</span>
                    <StatusBadge status={opt.role} />
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">{opt.desc}</p>
                </div>
                <input
                  type="radio"
                  name="role"
                  value={opt.role}
                  checked={selectedRole === opt.role}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="text-cyan-400 focus:ring-0"
                />
              </label>
            ))}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingUser(null)}
              className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="flex-1 cyber-btn text-xs py-3 font-bold"
            >
              {actionLoading ? "Updating Clearance..." : "Save Clearance"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Revoke Agent Credentials"
        subtitle="IRREVERSIBLE SECURITY ACTION"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete and permanently revoke access for agent{" "}
            <strong className="text-white font-mono">{deletingUser?.username}</strong>?
          </p>
          <p className="text-xs text-rose-400 font-mono">
            * This will terminate their active session and credentials. Existing uploaded evidence records and custody audit history will be preserved in the blockchain.
          </p>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setDeletingUser(null)}
              className="flex-1 py-3 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={actionLoading}
              className="flex-1 py-3 rounded-xl border border-rose-500/50 bg-rose-500/20 text-rose-300 text-xs font-bold hover:bg-rose-500/30 transition"
            >
              {actionLoading ? "Revoking..." : "Confirm Revocation"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Register Modal */}
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => {
          setShowRegisterModal(false);
          fetchUsers();
        }}
      />
    </div>
  );
}

export default Users;
