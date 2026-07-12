const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

export async function generateAIResponse(prompt: string, contextData: any): Promise<string> {
  let vehicles: any[] = [];
  let drivers: any[] = [];
  let trips: any[] = [];

  try {
    const token = localStorage.getItem('token');
    if (token) {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [vehiclesRes, driversRes, tripsRes] = await Promise.all([
        fetch('/api/vehicles/', { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch('/api/drivers/', { headers }).then((r) => (r.ok ? r.json() : [])),
        fetch('/api/trips/', { headers }).then((r) => (r.ok ? r.json() : [])),
      ]);
      vehicles = vehiclesRes;
      drivers = driversRes;
      trips = tripsRes;
    }
  } catch (err) {
    console.error("Failed to load real-time fleet data for AI context", err);
  }

  // Build a clean, structured context snapshot of the real database records
  const contextString = JSON.stringify(
    {
      userAskingContext: contextData,
      fleetVehiclesCount: vehicles.length,
      fleetVehicles: vehicles.map((v) => ({
        reg_no: v.registration_number,
        model: v.name_model,
        type: v.type,
        capacity: v.max_load_capacity,
        odometer: v.odometer,
        status: v.status,
      })),
      driversCount: drivers.length,
      drivers: drivers.map((d) => ({
        name: d.name,
        email: d.email,
        license: d.license_number,
        license_expiry: d.license_expiry_date,
        status: d.status,
        license_compliance: d.license_expired
          ? 'EXPIRED'
          : d.license_expiring_soon
          ? 'EXPIRING SOON'
          : 'VALID',
      })),
      tripsCount: trips.length,
      trips: trips.map((t) => ({
        id: `TR${String(t.id).padStart(4, '0')}`,
        route: `${t.source} → ${t.destination}`,
        cargo: t.cargo_weight,
        planned_distance: t.planned_distance,
        actual_distance: t.actual_distance,
        status: t.status,
        driver: t.driver?.name || 'Unassigned',
        vehicle: t.vehicle?.registration_number || 'Unassigned',
      })),
    },
    null,
    2
  );

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are TransitOps AI, a highly specialized virtual assistant embedded in TransitOps, a Smart Transport Operations platform.
You have full access to a live snapshot of the PostgreSQL database containing vehicles, drivers, and trips.

CURRENT DATABASE STATE:
${contextString}

Instructions:
1. Provide accurate, clear, and formatted tables or bullet points when answering questions about the fleet status.
2. Be direct, natural, and highly helpful.
3. If asked about revenue or general tips, answer them using your general knowledge in transport planning.
4. Try to keep answers concise and easy to read.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.15,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq returned status ${res.status}: ${errText}`);
    }

    const json = await res.json();
    return json.choices[0].message.content;
  } catch (error: any) {
    console.error('Error with Groq API:', error);
    return `I'm sorry, I'm currently unable to process your request due to a connection error: ${
      error?.message || error
    }. Please ensure the server is connected.`;
  }
}
