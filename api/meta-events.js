export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      event_name,
      event_id,
      event_source_url,
      fbp,
      client_ip_address,
      client_user_agent
    } = req.body || {};

    if (!event_name || !event_id) {
      return res.status(400).json({
        error: "event_name and event_id are required"
      });
    }

    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      return res.status(500).json({
        error: "Meta environment variables are missing"
      });
    }

    const event = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id,
      action_source: "website",
      event_source_url,
      user_data: {
        client_ip_address:
          client_ip_address ||
          req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
          "",
        client_user_agent:
          client_user_agent ||
          req.headers["user-agent"] ||
          "",
        ...(fbp ? { fbp } : {})
      }
    };

    const response = await fetch(
      `https://graph.facebook.com/v24.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data: [event]
        })
      }
    );

    const result = await response.json();

    return res.status(response.ok ? 200 : response.status).json(result);
  } catch (error) {
    return res.status(500).json({
      error: "CAPI request failed"
    });
  }
}
