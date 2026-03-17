const API_BASE_URL = "http://localhost:8000/api";

export const fetchDailySummary = async (date?: string) => {
  const url = date 
    ? `${API_BASE_URL}/reports/summary?target_date=${date}`
    : `${API_BASE_URL}/reports/summary`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch daily summary");
  return response.json();
};

export const fetchDeviceReport = async (deviceId: string, date?: string) => {
  const url = date
    ? `${API_BASE_URL}/reports/device/${deviceId}?target_date=${date}`
    : `${API_BASE_URL}/reports/device/${deviceId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch device report");
  return response.json();
};
