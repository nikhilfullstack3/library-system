const autocannon = require("autocannon");

function run(url, connections, duration, title) {
  return new Promise((resolve, reject) => {
    autocannon(
      {
        url,
        connections,
        duration,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        console.log(`\n=== ${title} ===`);
        console.log(
          JSON.stringify(
            {
              averageLatencyMs: Number(result.latency.average.toFixed(2)),
              averageReqPerSec: Number(result.requests.average.toFixed(2)),
              maxLatencyMs: result.latency.max,
              p97_5LatencyMs: result.latency.p97_5,
              totalRequests: result.requests.total,
            },
            null,
            2
          )
        );

        resolve(result);
      }
    );
  });
}

async function main() {
  const baseUrl = process.env.LOADTEST_BASE_URL || "http://127.0.0.1:5001";
  const libraryId = process.env.LOADTEST_LIBRARY_ID || "69b0f707f21135fbfe54b4e5";
  const duration = Number(process.env.LOADTEST_DURATION || 15);
  const connections = Number(process.env.LOADTEST_CONNECTIONS || 10);

  await run(`${baseUrl}/health`, 25, duration, "health");
  await run(`${baseUrl}/api/auth/libraries/${libraryId}/dashboard`, connections, duration, "dashboard");
  await run(`${baseUrl}/api/auth/libraries/${libraryId}/chat`, connections, duration, "chat");
}

main().catch((error) => {
  console.error("Load test failed:", error.message);
  process.exit(1);
});
