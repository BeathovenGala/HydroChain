import { useEffect, useState } from "react";
import { client } from "../../config";
import { POLL_INTERVAL_MS } from "@/lib/utils";
import { Card } from "./ui/card";

const TYPE_STYLES = {
    ISSUE: "bg-green-100 text-green-700",
    TRANSFER: "bg-blue-100 text-blue-700",
    RETIRE: "bg-gray-200 text-gray-700",
};

const shortHash = (hash) => `${hash.slice(0, 10)}…${hash.slice(-6)}`;

const LedgerCard = () => {
    const [ledger, setLedger] = useState(null);

    useEffect(() => {
        const load = () => client.get("/ledger").then((res) => setLedger(res.data.data)).catch(() => {});
        load();
        const timer = setInterval(load, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, []);

    if (!ledger) return null;
    const entries = [...ledger.entries].reverse();

    return (
        <Card className="m-5 w-[90%] p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-xl font-bold">⛓️ Credit Ledger</h2>
                    <p className="text-sm text-gray-500">Each block stores the SHA-256 hash of the one before it</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${ledger.valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {ledger.valid ? `✓ Chain verified · ${entries.length} blocks` : "✗ Chain tampered"}
                </span>
            </div>
            <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="text-left text-gray-600 border-b sticky top-0 bg-white">
                        <tr>
                            <th className="py-2">#</th>
                            <th>Event</th>
                            <th>Credit</th>
                            <th>From → To</th>
                            <th>Amount</th>
                            <th>Block hash</th>
                            <th>Previous hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((e) => (
                            <tr key={e.id} className={`border-b last:border-none ${e.valid ? "" : "bg-red-50"}`}>
                                <td className="py-2">{e.id}</td>
                                <td><span className={`px-2 py-0.5 rounded-full text-xs ${TYPE_STYLES[e.type]}`}>{e.type}</span></td>
                                <td className="font-mono">{e.creditId}</td>
                                <td>{e.fromUser ?? "mint"} → {e.toUser ?? "retired"}</td>
                                <td className="font-semibold">{e.amount}</td>
                                <td className="font-mono text-xs" title={e.hash}>{shortHash(e.hash)}</td>
                                <td className="font-mono text-xs text-gray-400" title={e.prevHash}>{shortHash(e.prevHash)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default LedgerCard;
