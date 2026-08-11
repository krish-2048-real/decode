import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { runTriageSymptom, TriageInput } from "./backend/services/triageService";
import { matchSchemes } from "./backend/services/schemesService";
import { getNearestFacilities } from "./backend/services/facilitiesService";
import { createAshaAlert, getAshaAlerts, getAshaAlertsAsync, updateAshaAlertStatus, updateAshaAlertStatusAsync, generateUserIdHash } from "./backend/services/alertsService";
import { generateVillageAdvisory } from "./backend/services/advisoryService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Arogya Sahayak", timestamp: new Date().toISOString() });
  });

  // Triage Symptom endpoint
  app.post("/api/triageSymptom", async (req, res) => {
    try {
      const input: TriageInput = req.body;
      if (!input || (!input.message && !input.imageBase64)) {
        return res.status(400).json({ error: "Missing required 'message' or 'imageBase64' field in body." });
      }

      const result = await runTriageSymptom(input);
      const userId = input.userId || "anon_user_" + Math.random().toString(36).substring(2, 8);
      const userIdHash = generateUserIdHash(userId);
      const sessionId = input.sessionId || "session_" + Date.now();

      let createdAlert = null;
      // Do NOT create local ASHA alert if the case is flagged as private/sensitive
      if (result.escalate_immediately && !result.is_private_routing) {
        createdAlert = createAshaAlert({
          sessionId,
          severity: result.severity === "CRITICAL" ? "CRITICAL" : "HIGH",
          symptomTags: result.symptoms.length > 0 ? result.symptoms : ["Critical Symptom"],
          userMessage: input.message || "Visual Symptom Assessment Request",
          escalationReason: result.escalation_reason || "Immediate triage escalation required.",
          district: input.userProfile?.state ? `${input.userProfile.state} Region` : "Rural District",
          userIdHash
        });
      }

      res.json({
        success: true,
        sessionId,
        userIdHash,
        result,
        alert: createdAlert
      });
    } catch (err: any) {
      console.error("Error in /api/triageSymptom:", err);
      res.status(500).json({ error: err.message || "Failed to process symptom triage." });
    }
  });

  // Schemes Matcher endpoint
  app.post("/api/matchSchemes", (req, res) => {
    try {
      const matches = matchSchemes(req.body || {});
      res.json({ success: true, count: matches.length, matches });
    } catch (err: any) {
      console.error("Error in /api/matchSchemes:", err);
      res.status(500).json({ error: "Failed to match schemes." });
    }
  });

  // Geocode location search endpoint via Nominatim API
  app.get("/api/geocode", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || !q.trim()) {
        return res.status(400).json({ error: "Missing query parameter 'q'." });
      }

      const queryStr = q.trim();
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(queryStr)}&limit=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'ArogyaSahayakApp/1.0 (health-access-initiative)'
        }
      });

      if (response.ok) {
        const results = await response.json();
        if (Array.isArray(results) && results.length > 0) {
          const match = results[0];
          return res.json({
            success: true,
            lat: parseFloat(match.lat),
            lng: parseFloat(match.lon),
            displayName: match.display_name
          });
        }
      }

      return res.json({ success: false, message: `Location "${queryStr}" not found in OpenStreetMap database.` });
    } catch (err: any) {
      console.error("Error in /api/geocode:", err);
      res.status(500).json({ error: "Geocoding service error." });
    }
  });

  // PHC Facilities endpoint with OSM Overpass integration
  app.get("/api/phcFacilities", async (req, res) => {
    try {
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
      const district = req.query.district ? (req.query.district as string) : undefined;

      const result = await getNearestFacilities(lat, lng, district);
      res.json({
        success: true,
        count: result.facilities.length,
        isFallback: result.isFallback,
        source: result.source,
        facilities: result.facilities
      });
    } catch (err: any) {
      console.error("Error in /api/phcFacilities:", err);
      res.status(500).json({ error: "Failed to retrieve PHC facilities." });
    }
  });

  // ASHA Alerts queue endpoint
  app.get("/api/ashaAlerts", async (req, res) => {
    try {
      const alerts = await getAshaAlertsAsync();
      res.json({ success: true, count: alerts.length, alerts });
    } catch (err: any) {
      console.error("Error in /api/ashaAlerts:", err);
      res.status(500).json({ error: "Failed to fetch ASHA alerts." });
    }
  });

  app.patch("/api/ashaAlerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['pending', 'acknowledged', 'visited'].includes(status)) {
        return res.status(400).json({ error: "Invalid status value." });
      }
      const updated = await updateAshaAlertStatusAsync(id, status);
      if (!updated) {
        return res.status(404).json({ error: "Alert not found." });
      }
      res.json({ success: true, alert: updated });
    } catch (err: any) {
      console.error("Error updating alert status:", err);
      res.status(500).json({ error: "Failed to update alert status." });
    }
  });

  // Village Health Advisory Generator endpoint
  app.post("/api/generateAdvisory", async (req, res) => {
    try {
      const { district, language } = req.body || {};
      const advisory = await generateVillageAdvisory(district || "Pune Rural (Khed Sector)", language || "en");
      res.json({ success: true, advisory });
    } catch (err: any) {
      console.error("Error generating advisory:", err);
      res.status(500).json({ error: "Failed to generate village health advisory." });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Arogya Sahayak] Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
