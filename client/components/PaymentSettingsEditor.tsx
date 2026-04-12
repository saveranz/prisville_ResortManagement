import React, { useEffect, useState } from "react";

interface PaymentSettings {
  account_name: string;
  mobile_number: string;
  note: string;
}

interface Props {
  isAdmin: boolean;
}

export const PaymentSettingsEditor: React.FC<Props> = ({ isAdmin }) => {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<PaymentSettings>({
    account_name: "",
    mobile_number: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/payment-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setForm({
          account_name: data.account_name || "",
          mobile_number: data.mobile_number || "",
          note: data.note || "",
        });
      })
      .catch(() => setError("Failed to load payment settings"));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/payment-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to update");
      const data = await res.json();
      setSettings(data);
      setEditMode(false);
      setSuccess(true);
    } catch (err) {
      setError("Failed to update payment settings");
    } finally {
      setLoading(false);
    }
  };

  if (!settings) return <div>Loading payment settings...</div>;

  return (
    <div className="border rounded p-4 bg-white max-w-lg">
      <h2 className="font-bold text-lg mb-2">GCash Payment Details</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {success && <div className="text-green-600 mb-2">Updated successfully!</div>}
      <div className="mb-2">
        <label className="block font-medium">Account Name</label>
        {editMode ? (
          <input
            name="account_name"
            value={form.account_name}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
          />
        ) : (
          <div>{settings.account_name}</div>
        )}
      </div>
      <div className="mb-2">
        <label className="block font-medium">Mobile Number</label>
        {editMode ? (
          <input
            name="mobile_number"
            value={form.mobile_number}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
          />
        ) : (
          <div>{settings.mobile_number}</div>
        )}
      </div>
      <div className="mb-2">
        <label className="block font-medium">Note</label>
        {editMode ? (
          <textarea
            name="note"
            value={form.note}
            onChange={handleChange}
            className="border rounded px-2 py-1 w-full"
          />
        ) : (
          <div>{settings.note}</div>
        )}
      </div>
      {isAdmin && (
        <div className="flex gap-2 mt-2">
          {editMode ? (
            <>
              <button
                className="bg-blue-600 text-white px-4 py-1 rounded"
                onClick={handleSave}
                disabled={loading}
              >
                Save
              </button>
              <button
                className="bg-gray-300 px-4 py-1 rounded"
                onClick={() => setEditMode(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="bg-blue-600 text-white px-4 py-1 rounded"
              onClick={() => setEditMode(true)}
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
};
