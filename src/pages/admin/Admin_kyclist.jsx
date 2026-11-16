
import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminKycList = () => {
  const [kycList, setKycList] = useState([]);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [loading, setLoading] = useState(false);

  const fetchKycList = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/admin/kyc", {
        params: { status, page, size },
      });
      setKycList(res.data);
    } catch (err) {
      console.error("Failed to fetch KYC list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycList();
  }, [status, page]);

  return (
    <div>
      <h1>KYC Documents</h1>
      <label>
        Status:{" "}
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </label>

      {loading && <p>Loading...</p>}

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>User ID</th>
            <th>Type</th>
            <th>Status</th>
            <th>Submitted At</th>
          </tr>
        </thead>
        <tbody>
          {kycList.length === 0 && !loading && (
            <tr>
              <td colSpan="5">No documents found.</td>
            </tr>
          )}
          {kycList.map((doc) => (
            <tr key={doc.id}>
              <td>{doc.id}</td>
              <td>{doc.user_id}</td>
              <td>{doc.document_type}</td>
              <td>{doc.status}</td>
              <td>{new Date(doc.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
          Previous
        </button>
        <span> Page {page} </span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
};

export default AdminKycList;
