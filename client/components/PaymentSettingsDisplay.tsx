import React, { useEffect, useState } from "react";

interface PaymentSettings {
  account_name: string;
  mobile_number: string;
  note: string;
}

export const PaymentSettingsDisplay: React.FC = () => {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/payment-settings")
      .then((res) => res.json())
      .then((data) => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load payment settings");
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading payment details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!settings) return <div>No payment details available.</div>;

  return (
    <div className="border rounded-lg p-4 bg-blue-50 max-w-md">
      <h3 className="font-bold text-lg mb-2">GCash Payment Details</h3>
      <div className="mb-1"><span className="font-medium">Account Name:</span> {settings.account_name}</div>
      <div className="mb-1"><span className="font-medium">Mobile Number:</span> {settings.mobile_number}</div>
      <div className="mb-1"><span className="font-medium">Note:</span> {settings.note}</div>
    </div>
  );
};
