
import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("");
  const [isActive, setIsActive] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
      };
      if (q) params.q = q;
      if (role) params.role = role;
      if (verifyStatus) params.verify_status = verifyStatus;
      if (isActive !== "") params.is_active = isActive === "true";

      const res = await axios.get("/admin/users", { params });
      setUsers(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, q, role, verifyStatus, isActive]);

  return (
    <div>
      <h1>User List</h1>

      <div>
        <input
          type="text"
          placeholder="Search by email / UID / name / phone"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All Roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super">Super Admin</option>
        </select>
        <select value={verifyStatus} onChange={(e) => setVerifyStatus(e.target.value)}>
          <option value="">All Verify Status</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={isActive} onChange={(e) => setIsActive(e.target.value)}>
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Banned</option>
        </select>
        <button onClick={() => setPage(1)}>Search</button>
      </div>

      {loading && <p>Loading...</p>}

      <table>
        <thead>
          <tr>
            <th>UID</th>
            <th>Email</th>
            <th>Full Name</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Verify Status</th>
            <th>Active</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 && !loading && (
            <tr>
              <td colSpan="8">No users found.</td>
            </tr>
          )}
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.uid}</td>
              <td>{user.email}</td>
              <td>{user.full_name ?? "-"}</td>
              <td>{user.phone ?? "-"}</td>
              <td>{user.role}</td>
              <td>{user.verify_status}</td>
              <td>{user.is_active ? "Yes" : "No"}</td>
              <td>{new Date(user.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Previous
        </button>
        <span>
          {" "}
          Page {page} / {Math.ceil(total / size)}{" "}
        </span>
        <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / size)}>
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminUserList;
