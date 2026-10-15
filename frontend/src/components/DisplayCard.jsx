import { Card } from "./ui/card";

const DisplayCard = ({
    variant = "numerical", // "numerical" | "nameDisplay"
    title = "Untitled",
    number,
    msg,
    displayName = "AuditName",
    subMsg
}) => {
    return (
        <Card className="m-5 w-[30%] p-6">
            <b className="block m-0 text-gray-700">{title}</b>

            {variant === "numerical" && (
                <div>
                    <p className="text-2xl font-bold text-green-600">{number}</p>
                    {msg && <p className="text-sm text-gray-500">{msg}</p>}
                </div>
            )}

            {variant === "nameDisplay" && (
                <div>
                    <p className="text-lg font-semibold">{displayName}</p>
                    {subMsg && <p className="text-sm text-gray-500">{subMsg}</p>}
                </div>
            )}
        </Card>
    );
};

export default DisplayCard;
