import { Card } from "./ui/card";

const CreditBalanceCard = ({ current, pending, lifetime }) => {
    return (
        <Card className="m-5 w-[45%] p-6">
            {/* Title */}
            <div className="mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    💧 Credit Balance
                </h2>
            </div>

            {/* Current Available Credits */}
            <div className="flex justify-between items-center bg-gray-200 rounded-md px-4 py-4 mb-4">
                <span className="font-medium text-gray-700">Current Available Credits</span>
                <span className="font-bold text-green-600">{current}</span>
            </div>

            {/* Pending Approval Credits */}
            <div className="flex justify-between items-center bg-orange-50 rounded-md px-4 py-4 mb-4">
                <span className="font-medium text-gray-700">Pending Approval Credits</span>
                <span className="font-bold text-orange-600">{pending}</span>
            </div>

            {/* Lifetime Credits */}
            <div className="flex justify-between items-center bg-green-50 rounded-md px-4 py-4">
                <span className="font-medium text-gray-700">Lifetime Credits</span>
                <span className="font-bold text-green-600">{lifetime}</span>
            </div>
        </Card>
    );
};

export default CreditBalanceCard;
