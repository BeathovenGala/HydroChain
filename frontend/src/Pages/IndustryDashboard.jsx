import CreditBalanceCard from "../components/CreditBalanceCard";
import DataTable from "../components/DataTable";
import IoTDataFeedCard from "../components/IoTDataFeedCard";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DisplayCard from "../components/DisplayCard";
import { client, errorMessage, NPOINT_URL } from "../../config";
import axios from "axios";

const IndustryDashboard = () => {
    const [username, setUsername] = useState("loading...");
    const [userData, setUserData] = useState();
    const [retireIndex, setRetireIndex] = useState();
    const [transferIndex, setTransferIndex] = useState();
    const [transferCredits, setTransferCredits] = useState([]);
    const [transferUsername, setTransferUsername] = useState("");
    const [credites, setCredits] = useState();
    const navigate = useNavigate();

    const retireData = [
        {
            "date": "2005-08-30",
            "hydrogenConsumed": 900,
            "timePeriod": "08:00 - 8:00",
            "energySource": "Solar",
            "location": "23.456, 72.345",
            "deviceId": "DEVICE-009"

        },
        {
            "date": "2025-08-30",
            "hydrogenConsumed": 100,
            "timePeriod": "08:00 - 16:00",
            "energySource": "Solar",
            "location": "23.456, 72.345",
            "deviceId": "DEVICE-002"

        }
    ];

    const transferData = [
        {
            "date": "2005-08-30",
            "hydrogenTransferred": 900,
            "transferStartTime": "91:00",
            "transferEndTime": "12:00",
            "transportMethod": "Pipeline",
            "trackingId": "TRACK-123",
            "location (from)": "23.456,72.345",
            "location (to)": "23.567,72.456",
            "deviceId": "DEVICE-008"
        },
        {
            "date": "2025-08-30",
            "hydrogenTransferred": 200,
            "transferStartTime": "09:00",
            "transferEndTime": "12:00",
            "transportMethod": "Pipeline",
            "trackingId": "TRACK-123",
            "location (from)": "23.456,72.345",
            "location (to)": "23.567,72.456",
            "deviceId": "DEVICE-003"
        }
    ]

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await client.get('/me');
                const fetchUsername = res?.data?.data?.username ?? '';

                setUsername(fetchUsername);

                const temp = await client.get(`/users/${fetchUsername}`);
                setUserData(temp.data.data);

                const index = await axios.get(NPOINT_URL);
                setRetireIndex(index?.data?.industryRetire);
                setTransferIndex(index?.data?.industryTransfer);
            } catch (err) {
                console.log("Failed to fetch user: ", err);
            }
        }
        fetchUser();
    }, [])

    async function retireCredit(creditId) {
        try {
            console.log(creditId);
            await client.post('/request/retire', {
                creditId,
                metadata: JSON.stringify(retireData[retireIndex])
            });
            alert("Retire request submitted for auditor approval!");
            location.reload();
        } catch (err) {
            console.error("Request failed:", err.response?.data || err.message);
            alert(`Error while retiring credit: ${errorMessage(err)}`);
        }
    }

    async function transferCredit(creditId) {
        try {
            const res = await client.post('/request/buy', {
                creditId,
                metadata: JSON.stringify(transferData[transferIndex])
            });
            alert("Transfer request submitted for auditor approval!");
            location.reload();
            console.log("Buy request success:", res.data);
        } catch (err) {
            console.error("Buy request failed:", err.response?.data || err.message);
            alert(`Error while transferring credit: ${errorMessage(err)}`);
        }
    }

    function creditHistroy(e) {
        return e.filter(item => item.type == "ISSUE");
    }

    function recentTransactions(e) {
        return e
    }

    return (
        <div className="bg-gray-100">
            {/* Navbar / Header */}
            <div className="p-4 cursor-pointer bg-[#507464]" onClick={() => navigate("/")}>
                <h1 className="text-white font-bold text-xl flex items-center space-x-2">
                    <img src="/logo.png" width={40} />
                    <span>HydroChain</span>
                </h1>
            </div>

            <h1 className="pl-[2.5%] mt-5 text-4xl font-bold w-[90%]">Welcome, {username} 🌱</h1>

            <div className="flex justify-center">
                <DisplayCard variant="numerical" title="Total Credit Retired" number={userData?.creditSummary?.lifeTimeRetiredCredits ?? '-'} msg="+12% from last month" />
                <DisplayCard variant="numerical" title="Total Credit Bought" number={userData?.creditSummary?.lifeTimeBoughtCredits ?? '-'} msg="77% utilization rate" />
                <DisplayCard variant="nameDisplay" title="Assigned Auditor" displayName={userData?.auditorUsername ?? "Not assigned"} subMsg="Verified & Active" />
            </div>

            <h1 className="pl-[2.5%] mt-5 text-4xl font-bold w-[90%]">Credit Management</h1>

            <div className="flex justify-center">
                <IoTDataFeedCard
                    requirements="date, hydrogenConsumed, timePeriod, energySource, location, deviceId, credits"
                    values={{
                        ...retireData[retireIndex],
                        credits: userData?.credits?.map(c => ({
                            label: `${c.id} (${c.amount})`,
                            value: c.id
                        }))
                    }}
                    dropdown={{ credits: true }}
                    onAction={(formValues) => retireCredit(formValues.credits)} // pass selected creditId
                    actionLabel="Retire Credits"
                />
                <CreditBalanceCard current={userData?.creditSummary?.activeAmount ?? '-'} pending={userData?.creditSummary?.pendingAmount ?? '-'} lifetime={userData?.creditSummary?.lifeTimeRetiredCredits ?? '-'} />
            </div>

            <div className="ml-[1.25%] w-full">
                <IoTDataFeedCard
                    requirements="date, hydrogenTransferred, transferStartTime, transferEndTime, transportMethod, trackingId, location (from), location (to), deviceId, username, creditId"
                    values={{
                        ...transferData[transferIndex],
                        username: transferUsername || "",
                        creditId: transferCredits?.map(c => ({
                            label: `${c.id} (${c.amount})`,
                            value: c.id
                        })) ?? []
                    }}
                    dropdown={{ creditId: true }}
                    onFieldChange={(field, value) => {
                        if (field === "username") {
                            setTransferUsername(value);
                        }
                    }}
                    onFieldEnter={async (field, value) => {
                        if (field === "username") {
                            try {
                                const res = await client.get(`/users/${value}`);
                                const credits = res?.data?.data?.credits || [];
                                setTransferCredits(credits);
                            } catch (err) {
                                console.error("Failed to fetch user credits:", err);
                            }
                        }
                    }}
                    onAction={(formValues) => {
                        transferCredit(formValues.creditId);
                    }}
                    actionLabel="Transfer Credits"
                />

            </div>

            <div className="bg-gray-50 border-t-gray-200 border-1 mt-8 w-full p-5 text-gray-500">
                © {new Date().getFullYear()} HydroChain
            </div>
        </div>
    );
}

export default IndustryDashboard;