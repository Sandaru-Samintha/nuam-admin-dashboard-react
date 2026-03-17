import { useState, useEffect, useRef } from "react";
import { useIpAddressManagement } from "@/hooks/useIpAddressManagement";

export default function SettingsPage() {
  const [subnet, setSubnet] = useState("");
  const [newDeviceIP, setNewDeviceIP] = useState("");
  const [message, setMessage] = useState("");

  const { networkStats, updateNetworkSettings, extractInputData } =
    useIpAddressManagement();

  // Use a ref to track if we already loaded the previous values
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Only load previous values if networkStats has real values
    if (
      isInitialLoad.current &&
      networkStats.base_ip &&
      networkStats.subnet_mask &&
      networkStats.base_ip !== "-" &&
      networkStats.subnet_mask !== "-"
    ) {
      const { ip, subnet } = extractInputData(networkStats);
      setNewDeviceIP(ip);
      setSubnet(subnet);
      isInitialLoad.current = false; // ensure we only set once
    }
  }, [networkStats, extractInputData]);

  const handleUpdateBoth = () => {
    const mask = subnet.trim();
    const ip = newDeviceIP.trim();

    // Subnet validation
    if (mask) {
      const maskRegex =
        /^(255|254|252|248|240|224|192|128|0)\.(255|254|252|248|240|224|192|128|0)\.(255|254|252|248|240|224|192|128|0)\.(0|128|192|224|240|248|252|254|255)$/;
      const binary = mask
        .split(".")
        .map((n) => parseInt(n).toString(2).padStart(8, "0"))
        .join("");
      if (!maskRegex.test(mask) || !/^1*0*$/.test(binary)) {
        return setMessage("Invalid subnet mask ❌");
      }
    }

    // IP validation
    if (ip) {
      const ipv4Regex =
        /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
      if (!ipv4Regex.test(ip)) {
        return setMessage("Invalid IP address ❌");
      }
    }

    if (!mask && !ip) {
      return setMessage("Enter subnet mask or device IP ⚠️");
    }

    updateNetworkSettings(mask || undefined, ip || undefined);
    setMessage("Settings updated successfully ✅");

    setSubnet("");
    setNewDeviceIP("");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-start py-10">
      <div className="w-full max-w-2xl bg-white shadow-lg rounded-2xl p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Network Settings
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Configure subnet mask and device IP address
        </p>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Subnet Mask (e.g. 255.255.255.0)"
            value={subnet}
            onChange={(e) => setSubnet(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />

          <input
            type="text"
            placeholder="Device IP (e.g. 10.0.0.12)"
            value={newDeviceIP}
            onChange={(e) => setNewDeviceIP(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
          />

          <button
            onClick={handleUpdateBoth}
            className="bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Save Settings
          </button>
        </div>

        {message && (
          <div className="mt-4 text-sm text-center font-medium text-gray-700">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}