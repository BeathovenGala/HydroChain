import DisplayCard from "@/components/DisplayCard";
import { client, errorMessage } from "../../config";
import { useEffect, useState } from "react";
import DataTable from "@/components/DataTable";
import { useNavigate } from "react-router-dom";

const AuditDashboard = () => {
    const [username, setUsername] = useState("loading...");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Fetch user info + requests
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Get logged-in user info
                const res = await client.get("/me");
                setUsername(res.data.data.username);

                // Fetch issue, buy, retire requests
                const [issues, buys, retires] = await Promise.all([
                    client.get("/request/issues"),
                    client.get("/request/buy"),
                    client.get("/request/retire"),
                ]);

                const combined = [
                    ...issues.data.data.map((r) => ({
                        id: r.id,
                        amount: r.amount,
                        issuedAt: r.createdAt,
                        status: r.status?.toUpperCase() || "UNKNOWN",
                        type: "ISSUE",
                        requester: r.requester,
                        metadata: r.metadata,
                        anomaly: r.anomaly, // <-- include anomaly
                    })),
                    ...buys.data.data.map((r) => ({
                        id: r.id,
                        amount: r.amount ?? 0,
                        issuedAt: r.createdAt ?? null,
                        status: r.status?.toUpperCase() || "UNKNOWN",
                        type: "BUY",
                        requester: r.requester,
                        creditId: r.creditId,
                        metadata: r.metadata,
                        anomaly: r.anomaly, // <-- include anomaly
                    })),
                    ...retires.data.data.map((r) => ({
                        id: r.id,
                        amount: r.amount ?? 0,
                        issuedAt: r.createdAt ?? null,
                        status: r.status?.toUpperCase() || "UNKNOWN",
                        type: "RETIRE",
                        requester: r.requester,
                        creditId: r.creditId,
                        metadata: r.metadata,
                        anomaly: r.anomaly, // <-- include anomaly
                    })),
                ];

                console.table(combined.map((r) => ({ type: r.type, status: r.status })));
                setRequests(combined);
            } catch (err) {
                console.error("Failed to fetch requests:", err);
                alert(`Failed to fetch requests: ${errorMessage(err)}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Handle Accept/Reject actions
    const handleAuditAction = async (row, action) => {
        try {
            let endpoint = "";

            if (row.type === "ISSUE") endpoint = `/request/issues/${row.id}/${action}`;
            else if (row.type === "BUY") endpoint = `/request/buy/${row.id}/${action}`;
            else if (row.type === "RETIRE") endpoint = `/request/retire/${row.id}/${action}`;

            await client.post(endpoint, {});
            alert(`${action === "accept" ? "Accepted" : "Rejected"} request`);

            // Update requests locally
            setRequests((prev) =>
                prev.map((r) =>
                    r.id === row.id
                        ? { ...r, status: action === "accept" ? "APPROVED" : "REJECTED" }
                        : r
                )
            );
        } catch (err) {
            console.error("Action failed:", err);
            alert(`Action failed: ${errorMessage(err)}`);
        }
    };

    // Count pending requests (robust)
    const countPending = (type) =>
        requests.filter(
            (r) =>
                r.type?.toUpperCase() === type.toUpperCase() &&
                r.status?.toUpperCase() === "PENDING"
        ).length;

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Navbar / Header */}
            <div
                className="p-4 cursor-pointer bg-[#507464]"
                onClick={() => navigate("/")}
            >
                <h1 className="text-white font-bold text-xl flex items-center space-x-2">
                    <img src="/logo.png" width={40} alt="logo" />
                    <span>HydroChain</span>
                </h1>
            </div>

            <h1 className="pl-[2.5%] mt-5 text-4xl font-bold w-[90%]">
                Welcome, {username} 🌱
            </h1>

            {/* Display Cards */}
            <div className="flex justify-center gap-4 mt-4">
                {["ISSUE", "BUY", "RETIRE"].map((t) => (
                    <DisplayCard
                        key={t}
                        variant="numerical"
                        title={`Total Pending ${t === "BUY" ? "Transfer" : t} Requests`}
                        number={countPending(t)}
                    />
                ))}
            </div>

            <h1 className="pl-[2.5%] mt-5 text-3xl font-bold w-[90%]">
                Requests Table
            </h1>

            <div className="flex justify-center">
                {loading ? (
                    <p className="m-5 text-gray-500">Loading requests...</p>
                ) : (
                    <DataTable data={requests} audit onAuditAction={handleAuditAction} />
                )}
            </div>

            <div className="flex flex-col min-h-[35dvh]">
                <main className="flex-grow">{/* Page content */}</main>

                <footer className="bg-gray-50 border-t border-t-gray-200 w-full p-5 text-gray-500 text-center">
                    © {new Date().getFullYear()} HydroChain
                </footer>
            </div>
        </div>
    );
};

export default AuditDashboard;
