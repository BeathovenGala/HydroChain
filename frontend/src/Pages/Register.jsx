import { client, errorMessage } from "../../config";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Register = () => {
    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [role, setRole] = useState("Plant");
    const [companyName, setCompanyName] = useState();
    const [did, setDid] = useState();
    const [governmentLicenseId, setGovernmentLicenseId] = useState();
    const [auditorUsername, setAuditorUsername] = useState();
    const navigate = useNavigate();

    async function register() {
        try {
            await client.post("/users", {
                username,
                password,
                role,
                companyName,
                did,
                governmentLicenseId,
                auditorUsername
            });
            alert("Registration successful! Please log in.");
            navigate("/login");
        } catch (err) {
            alert(`Registration failed: ${errorMessage(err)}`);
        }
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* Navbar / Header */}
            <div className="p-4 cursor-pointer bg-[#507464]" onClick={() => navigate("/")}>
                <h1 className="text-white font-bold text-xl flex items-center space-x-2">
                    <img src="/logo.png" width={40} />
                    <span>HydroChain</span>
                </h1>
            </div>

            {/* Centered Register Card */}
            <div className="flex flex-1 justify-center items-center">
                <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md">
                    <h2 className="text-2xl font-semibold text-center">Join Our Platform</h2>
                    <p className="text-gray-500 text-center mb-6">
                        Register your organization to get started
                    </p>

                    {/* Role Selector */}
                    <div className="flex justify-between bg-gray-100 rounded-lg mb-6">
                        {["Plant", "Industry"].map((item) => (
                            <button
                                key={item}
                                onClick={() => setRole(item)}
                                className={`flex-1 py-2 text-sm font-medium rounded-lg ${role === item
                                    ? "bg-white border border-gray-300 shadow-sm text-green-600"
                                    : "text-gray-600"
                                    }`}
                            >
                                {item}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <form onSubmit={(e) => { e.preventDefault(); register(); }} className="space-y-4">
                        {role === "Plant" ? (
                            <div>
                                <label className="block text-sm font-medium mb-1">Plant Name</label>
                                <input
                                    type="text"
                                    onInput={e => setCompanyName(e.target.value)}
                                    placeholder="Enter plant name"
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium mb-1">Industry Name</label>
                                <input
                                    type="text"
                                    onInput={e => setCompanyName(e.target.value)}
                                    placeholder="Enter industry name"
                                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium mb-1">User Name</label>
                            <input
                                type="text"
                                placeholder="Choose a username"
                                onInput={e => setUsername(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                type="password"
                                onInput={e => setPassword(e.target.value)}
                                placeholder="Create a password"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Decentralized Identity (DID)</label>
                            <input
                                type="text"
                                onInput={e => setDid(e.target.value)}
                                placeholder="Enter Decentralized Identity (DID)"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Government License ID</label>
                            <input
                                type="text"
                                onInput={e => setGovernmentLicenseId(e.target.value)}
                                placeholder="Enter government license ID"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Assigned Auditor ID</label>
                            <input
                                type="text"
                                onInput={e => setAuditorUsername(e.target.value)}
                                placeholder="Enter assigned auditor ID"
                                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                        >
                            Register {role}
                        </button>
                    </form>

                    {/* Login Redirect */}
                    <p className="text-sm text-center mt-4">
                        Already have an account?{" "}
                        <Link to="/login" className="text-green-600 font-medium hover:underline">
                            Login here
                        </Link>
                    </p>

                    <p className="text-xs text-gray-400 text-center mt-2">
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;