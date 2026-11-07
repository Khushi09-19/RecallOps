const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

// Always load .env from the backend folder
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const { HindsightClient } = require("@vectorize-io/hindsight-client");

const app = express();

app.use(cors());
app.use(express.json());
// -----------------------------
// GET ALL INCIDENTS
// -----------------------------

app.get("/api/incidents", (req, res) => {
    db.query(
        "SELECT * FROM incidents ORDER BY id DESC",
        (err, result) => {
            if (err) {
                console.error("Incident fetch error:", err);

                return res.status(500).json({
                    message: "Error fetching incidents"
                });
            }

            res.json(result);
        }
    );
});

// -----------------------------
// HINDSIGHT CONNECTION
// -----------------------------

const BANK_ID = process.env.HINDSIGHT_BANK_ID;

const hindsight = process.env.HINDSIGHT_API_KEY
    ? new HindsightClient({
        baseUrl: process.env.HINDSIGHT_API_URL,
        apiKey: process.env.HINDSIGHT_API_KEY
    })
    : null;

console.log("Hindsight key loaded:", Boolean(hindsight));
console.log("Hindsight URL:", process.env.HINDSIGHT_API_URL || "Not configured");
console.log("Hindsight bank:", BANK_ID || "Not configured");

// -----------------------------
// LOCAL INCIDENT MATCHING
// -----------------------------

function getWords(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(word => word.length > 2);
}

function calculateSimilarity(incident, searchText, serviceName) {
    let score = 0;

    const incidentService = String(
        incident.service_name || ""
    ).toLowerCase().trim();

    const requestedService = String(
        serviceName || ""
    ).toLowerCase().trim();

    // Give extra importance to matching services
    if (
        requestedService &&
        incidentService &&
        requestedService === incidentService
    ) {
        score += 10;
    }

    const searchWords = [...new Set(getWords(searchText))];

    const incidentText = [
        incident.title,
        incident.description,
        incident.service_name,
        incident.error_message,
        incident.symptoms,
        incident.root_cause,
        incident.resolution
    ].join(" ").toLowerCase();

    searchWords.forEach(word => {
        if (incidentText.includes(word)) {
            score += 2;
        }
    });

    return score;
}

// -----------------------------
// HOME / BACKEND TEST
// -----------------------------

app.get("/", (req, res) => {
    res.send("Welcome to RecallOps Backend!");
});

// -----------------------------
// HINDSIGHT CONNECTION TEST
// -----------------------------

app.get("/api/hindsight-test", async (req, res) => {
    try {
        if (!hindsight || !BANK_ID) {
            return res.status(500).json({
                success: false,
                message: "Hindsight configuration is missing."
            });
        }

        const result = await hindsight.recall(
            BANK_ID,
            "Find previous incident memories"
        );

        return res.json({
            success: true,
            message: "Hindsight connected successfully!",
            memories: result.results || []
        });

    } catch (error) {
        console.error("Hindsight test error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Unknown Hindsight error"
        });
    }
});

// -----------------------------
// RESOLVE INCIDENT
// -----------------------------

app.put("/api/incidents/:id/resolve", (req, res) => {
    const { id } = req.params;
    const { root_cause, resolution } = req.body;

    if (!root_cause?.trim() || !resolution?.trim()) {
        return res.status(400).json({
            success: false,
            message: "Root cause and resolution are required."
        });
    }

    const sql = `
        UPDATE incidents
        SET
            root_cause = ?,
            resolution = ?,
            status = 'RESOLVED',
            resolved_at = NOW(),
            resolution_minutes = TIMESTAMPDIFF(MINUTE, created_at, NOW())
        WHERE id = ?
    `;

    db.query(sql, [root_cause, resolution, id], async (err, result) => {
        if (err) {
            console.error("Incident resolution error:", err);

            return res.status(500).json({
                success: false,
                message: "Unable to resolve incident."
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Incident not found."
            });
        }

        let memoryStatus = "not_configured";

        if (hindsight && BANK_ID) {
            try {
                const memoryContent = `
                    Resolved Incident ID: ${id}
                    Root Cause: ${root_cause}
                    Resolution: ${resolution}
                    Status: RESOLVED
                `;

                await hindsight.retain(BANK_ID, memoryContent);

                memoryStatus = "saved";

            } catch (memoryError) {
                console.error(
                    "Hindsight retain error:",
                    memoryError.message
                );

                memoryStatus = "failed";
            }
        }

        return res.json({
            success: true,
            message: "Incident resolved successfully.",
            memoryStatus
        });
    });
});

// -----------------------------
// ADD NEW INCIDENT
// -----------------------------

app.post("/api/incidents", (req, res) => {
    const {
        title,
        description,
        service_name,
        severity,
        error_message,
        symptoms
    } = req.body;

    const sql = `
        INSERT INTO incidents
        (title, description, service_name, severity, error_message, symptoms)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
        title,
        description,
        service_name,
        severity,
        error_message,
        symptoms
    ];

    db.query(sql, values, async (err, result) => {
        if (err) {
            console.error("Incident save error:", err);

            return res.status(500).json({
                message: "Error saving incident"
            });
        }

        const incidentId = result.insertId;

        // Attempt to save the incident in Hindsight.
        // MySQL saving succeeds even if Hindsight is unavailable.
        let memoryStatus = "unavailable";

        if (hindsight && BANK_ID) {
            try {
                const memoryContent = `
                    Incident ID: ${incidentId}
                    Title: ${title || ""}
                    Service: ${service_name || ""}
                    Severity: ${severity || ""}
                    Description: ${description || ""}
                    Error Message: ${error_message || ""}
                    Symptoms: ${symptoms || ""}
                `;

                await hindsight.retain(
                    BANK_ID,
                    memoryContent
                );

                memoryStatus = "saved";

            } catch (memoryError) {
                console.error(
                    "Hindsight memory save error:",
                    memoryError.message
                );

                memoryStatus = "failed";
            }
        }

        res.status(201).json({
            message: "Incident saved successfully",
            incidentId,
            memoryStatus
        });
    });
});

// -----------------------------
// LOCAL INCIDENT RECALL
// -----------------------------

app.post("/api/recall", (req, res) => {
    const {
        query,
        service_name,
        symptoms,
        error_message
    } = req.body;

    const searchText = [
        query,
        symptoms,
        error_message
    ].filter(Boolean).join(" ");

    if (!searchText.trim() && !service_name) {
        return res.status(400).json({
            success: false,
            message: "Enter a search query or service name."
        });
    }

    db.query(
        "SELECT * FROM incidents ORDER BY id DESC",
        (err, incidents) => {
            if (err) {
                console.error("Local recall error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Unable to search previous incidents."
                });
            }

            const matches = incidents
                .map(incident => {
                    const score = calculateSimilarity(
                        incident,
                        searchText,
                        service_name
                    );

                    return {
                        ...incident,
                        similarity_score: score,
                        similarity: score
                    };
                })
                .filter(incident => incident.similarity_score > 0)
                .sort((a, b) =>
                    b.similarity_score - a.similarity_score
                )
                .slice(0, 5);

            // Search matching runbooks
            db.query(
                "SELECT * FROM runbooks",
                (runbookErr, runbooks) => {
                    if (runbookErr) {
                        console.error("Runbook search error:", runbookErr);

                        return res.status(500).json({
                            success: false,
                            message: "Incidents were found, but runbooks could not be searched."
                        });
                    }

                    const searchWords = searchText
                        .toLowerCase()
                        .split(/[^a-z0-9]+/)
                        .filter(word => word.length > 2);

                    const recommendedRunbooks = runbooks
                        .map(runbook => {
                            const runbookText = [
                                runbook.title,
                                runbook.description,
                                runbook.service_name,
                                runbook.steps
                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();

                            let score = 0;

                            // Match service name
                            if (
                                service_name &&
                                runbook.service_name &&
                                runbook.service_name.toLowerCase().trim() ===
                                service_name.toLowerCase().trim()
                            ) {
                                score += 5;
                            }

                            // Match incident keywords
                            searchWords.forEach(word => {
                                if (runbookText.includes(word)) {
                                    score += 1;
                                }
                            });

                            return {
                                ...runbook,
                                relevance_score: score
                            };
                        })
                        .filter(runbook => runbook.relevance_score > 0)
                        .sort((a, b) =>
                            b.relevance_score - a.relevance_score
                        )
                        .slice(0, 3);

                    res.json({
                        success: true,
                        source: "local_mysql",
                        message: matches.length
                            ? "Similar past incidents found."
                            : "No similar past incidents found.",
                        totalMatches: matches.length,
                        matches,
                        recommendedRunbooks,
                        suggestedResolution: matches.length
                            ? matches[0].resolution ||
                              "No resolution recorded for this incident."
                            : "No previous resolution is available. Record the root cause and resolution after investigating."
                    });
                }
            );
        }
    );
});

// -----------------------------
// GET ALL RUNBOOKS
// -----------------------------

app.get("/api/runbooks", (req, res) => {
    db.query(
        "SELECT * FROM runbooks ORDER BY id DESC",
        (err, result) => {
            if (err) {
                console.error("Runbook fetch error:", err);

                return res.status(500).json({
                    message: "Error fetching runbooks"
                });
            }

            res.json(result);
        }
    );
});

// -----------------------------
// ADD NEW RUNBOOK
// -----------------------------

app.post("/api/runbooks", (req, res) => {
    const {
        title,
        service_name,
        description,
        steps
    } = req.body;

    const sql = `
        INSERT INTO runbooks
        (title, service_name, description, steps)
        VALUES (?, ?, ?, ?)
    `;

    const values = [
        title,
        service_name,
        description,
        steps
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Runbook save error:", err);

            return res.status(500).json({
                message: "Error saving runbook"
            });
        }

        res.status(201).json({
            message: "Runbook saved successfully",
            runbookId: result.insertId
        });
    });
});

// -----------------------------
// START SERVER
// -----------------------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`RecallOps server running on port ${PORT}`);
});