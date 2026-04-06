export type SystemHealth = {
  status: "ok";
  service: "openbacklog-web";
  timestamp: string;
};

export function getSystemHealth(): SystemHealth {
  return {
    status: "ok",
    service: "openbacklog-web",
    timestamp: new Date().toISOString(),
  };
}
