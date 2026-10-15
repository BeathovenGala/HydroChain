import { useState } from "react";
import { Card } from "./ui/card";

const IoTDataFeedCard = ({ requirements, values = {}, onAction, actionLabel, dropdown = {}, onFieldChange, onFieldEnter }) => {
  const fields = typeof requirements === "string" ? requirements.split(",").map(f => f.trim()) : requirements;

  const [selected, setSelected] = useState({});

  function getInputType(field, value) {
    if (typeof value === "number") return "number";
    return "text";
  }

  const handleSelectChange = (field, value) => {
    setSelected(prev => ({ ...prev, [field]: value }));
    onFieldChange?.(field, value);
  };

  const mergedValues = { ...values, ...selected };

  fields.forEach(field => {
    if (dropdown[field]) {
      mergedValues[field] = selected[field] || "";
    }
  });

  return (
    <Card className="m-5 w-[47.5%] p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">⚙️ IoT-based Data Feed</h2>
        <p className="text-sm text-gray-500">For verification by auditor</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium">
              {field.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase())}
            </label>

            {dropdown[field] && Array.isArray(values[field]) ? (
              <select
                className="w-full mt-1 p-2 border rounded-md bg-white"
                value={mergedValues[field] || ""}
                onChange={(e) => handleSelectChange(field, e.target.value)}
              >
                <option value="" disabled>-- Select --</option>
                {values[field].map((option, idx) => (
                  <option key={idx} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : field === "username" ? (
              <input
                type="text"
                value={mergedValues[field] || ""}
                onChange={(e) => handleSelectChange(field, e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onFieldEnter?.(field, e.target.value);
                  }
                }}
                className="w-full mt-1 p-2 border rounded-md bg-white"
              />
            ) : (
              <input
                type={getInputType(field, values[field])}
                value={mergedValues[field] || ""}
                readOnly
                className="w-full mt-1 p-2 border rounded-md bg-gray-50"
              />
            )}
          </div>
        ))}
      </div>

      {onAction && (
        <div className="mt-6">
          <button
            onClick={() => onAction(mergedValues)}
            className="cursor-pointer w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
          >
            {actionLabel || "Submit"}
          </button>
        </div>
      )}
    </Card>
  );
};

export default IoTDataFeedCard;
