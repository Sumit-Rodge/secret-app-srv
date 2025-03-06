const express = require("express");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 3000;

// Define Key Vault details
const keyVaultName = "testkv121"; // Replace with your Key Vault name
const secretName = "temp"; // Replace with your secret name
const keyVaultUri = `https://${keyVaultName}.vault.azure.net`;
const apiVersion = "7.3"; // Azure Key Vault API version

// Azure Managed Identity Environment Variables
const identityEndpoint = process.env.IDENTITY_ENDPOINT;
const identityHeader = process.env.IDENTITY_HEADER;

if (!identityEndpoint || !identityHeader) {
    console.error("Managed Identity environment variables are missing.");
    process.exit(1);
}

console.log("IDENTITY_ENDPOINT:", identityEndpoint);
console.log("IDENTITY_HEADER:", identityHeader);

// Endpoint to fetch secret from Key Vault
app.get("/get-secret", async (req, res) => {
    try {
        // Step 1: Get Access Token for Key Vault
        const tokenUri = `${identityEndpoint}?resource=https://vault.azure.net/&api-version=2019-08-01`;
        console.log("Token URI:", tokenUri);

        const tokenResponse = await axios.get(tokenUri, {
            headers: { "X-IDENTITY-HEADER": identityHeader },
        });

        const accessToken = tokenResponse.data.access_token;
        console.log("Access Token retrieved successfully.");

        // Step 2: Retrieve Secret from Key Vault
        const secretUri = `${keyVaultUri}/secrets/${secretName}?api-version=${apiVersion}`;
        console.log("Secret URI:", secretUri);

        const secretResponse = await axios.get(secretUri, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const secretValue = secretResponse.data.value;
        console.log("Secret Value:", secretValue);

        res.json({ secret: secretValue });
    } catch (error) {
        console.error("Error retrieving secret:", error.response?.data || error.message);
        res.status(500).json({ error: "Failed to retrieve secret" });
    }
});

// Start Express server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
