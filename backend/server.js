const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import the cors module
const app = express();
const port = 5000;

const JIRA_URL = "https://jira-qa.spirenteng.com";
const API_TOKEN = "MjQzNDYyMDk5OTE0OmlLkGEVs19rBbJTVBWp7XWFPiMj";
const MAX_FETCHED_ISSUES = 100; // Limit to prevent infinite fetching
// const jqlQuery = "(project = LS OR project = ORAN) AND \"Target Release\" in (LS-24.2) and Component in (\"TAS\", TC-GUI)"; // Example JQL query

app.use(cors()); // Enable CORS for all routes
// a middleware is responsible for parsing JSON formatted request bodies 
// and making the parsed data available in req.body.
app.use(express.json()); 

app.get('/', (req, res) => {
    res.send('Welcome to the Jira Ticket Management API. Use /api/tickets to get the tickets.');
});

// Middleware to fetch tickets (should be initialized first before it's used)
const fetchTicketsMiddleware = async (req, res, next) => {
    const jqlQuery = req.query.jql || 'project = LS'; // Use the JQL query from the request
    const maxResults = parseInt(req.query.maxResults) || 50;
    let startAt = 0;
    let allIssues = [];

    console.log(`Fetching tickets with JQL: ${jqlQuery}`); // Log the JQL query

    try {
        while (allIssues.length < MAX_FETCHED_ISSUES) {
            const encodedJql = encodeURIComponent(jqlQuery);
            const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}&fields=*all`; // Include all fields in the response

            console.log(`Making GET request to URL: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            });

            console.log(`Received response status: ${response.status}`);
            const jsonNode = response.data;
            const issues = jsonNode.issues;

            if (!issues || issues.length === 0) {
                console.log('No more issues found.');
                break;
            } else {
                allIssues = allIssues.concat(issues);
                console.log(`Fetched ${issues.length} issues, total fetched: ${allIssues.length}`);
                startAt += maxResults;
                if (issues.length < maxResults) {
                    break;
                }
            }
        }

        req.fetchedIssues = allIssues;
        next();
    } catch (error) {
        console.error(`Error fetching tickets: ${error.message}`); // Log the error message
        res.status(500).json({ error: error.message });
    }
};

// fetching all tickets (By entering JQL query)
app.get('/api/tickets', fetchTicketsMiddleware, (req, res) => {
    res.json(req.fetchedIssues);
});

// Update “components” field in tickets using a PUT request 
app.put('/api/tickets/updateComponents', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues;

    for (const issue of allIssues) {
        const issueKey = issue.key;
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;
        const updateData = { fields: { components: newComponents } };

        console.log(`Updating components for ticket with issue key: ${issueKey}`);
        try {
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`Components updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            console.error(`Error updating components for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    res.json({ message: 'Components updated for all tickets successfully.' });
});

// Update "Target Release (customfield_17644)" field in tickets using a PUT request
app.put('/api/tickets/updateTargetRelease', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues;
    
    for (const issue of allIssues) {
        const issueKey = issue.key;
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;
        const updateData = { fields: { customfield_17644: newCustomField17644 } };

        console.log(`Updating customfield_17644 for ticket with issue key: ${issueKey}`);
        try {
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`customfield_17644 updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            console.error(`Error updating customfield_17644 for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    res.json({ message: 'customfield_17644 updated for all tickets successfully.' });

});

// Update “Target Version (customfield_11200)” field in tickets using a PUT request 
app.put('/api/tickets/updateTargetVersion', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues;

    for (const issue of allIssues) {
        const issueKey = issue.key;
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;
        const updateData = { fields: { customfield_11200: newCustomField11200 } };

        console.log(`Updating customfield_11200 for ticket with issue key: ${issueKey}`);
        try {
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`customfield_11200 updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            console.error(`Error updating customfield_11200 for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    res.json({ message: 'customfield_11200 updated for all tickets successfully.' });

});


// Update “SR Number (customfield_17643)” field in tickets using a PUT request
app.put('/api/tickets/updateSRnumber', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues;

    for (const issue of allIssues) {
        const issueKey = issue.key;
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;
        const updateData = { fields: { customfield_17643: newCustomField17643 } };

        console.log(`Updating customfield_17643 for ticket with issue key: ${issueKey}`);
        try {
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`customfield_17643 updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            console.error(`Error updating customfield_17643 for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    res.json({ message: 'customfield_17643 updated for all tickets successfully.' });

});


// Update “SalesForce CR (customfield_17687)” field in tickets using a PUT request
app.put('/api/tickets/updateSalesForceCR', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues;
    
    for (const issue of allIssues) {
        const issueKey = issue.key;
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;
        const updateData = { fields: { customfield_17687: newCustomField17687 } };

        console.log(`Updating customfield_17687 for ticket with issue key: ${issueKey}`);
        try {
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`customfield_17687 updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            console.error(`Error updating customfield_17687 for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    res.json({ message: 'customfield_17687 updated for all tickets successfully.' });
});

// Adding comments to all tickets fetched by JQL query
// iterate over the fetched issues and add a comment to each ticket:
app.post('/api/tickets/comments', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues;

    for (const issue of allIssues) {
        const issueKey = issue.key;
        const commentUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}/comment`;
        const comment = { body: commentBody };
            
        console.log(`Adding comment to ticket with issue key: ${issueKey}`);
        try {
            const response = await axios.post(commentUrl, comment, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            console.log(`Comment added to ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            console.error(`Error adding comment to ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }
        
    res.json({ message: 'Comments added to all tickets successfully.' });

});

// Function to sync SR Number and CR Number from Linked Tickets ***
app.post('/api/tickets/sync-sr-cr-numbers', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues;

    try {
        for (let issue of allIssues) {
            const linkedIssues = issue.fields.issuelinks;

            if (linkedIssues && linkedIssues.length > 0) {
                const outwardIssue = linkedIssues[0]?.outwardIssue;

                if (outwardIssue) {
                    const linkedIssueDetails = await fetchIssueDetails(outwardIssue.id);

                    // Sync SR Number if empty
                    if (!issue.fields.customfield_17643 && linkedIssueDetails && linkedIssueDetails.fields.customfield_17801) {
                        const srNumber = extractSRCRNumber(linkedIssueDetails.fields.customfield_17801);
                        await updateIssueField(issue.id, { customfield_17643: srNumber });
                        console.log(`SR Number updated for ticket ${issue.key}: ${srNumber}`);
                    }

                    // Sync CR Number (SalesForce CR) if empty
                    if (!issue.fields.customfield_17687 && linkedIssueDetails && linkedIssueDetails.fields.customfield_17800) {
                        const crNumber = extractSRCRNumber(linkedIssueDetails.fields.customfield_17800);
                        await updateIssueField(issue.id, { customfield_17687: crNumber });
                        console.log(`CR Number (SalesForce CR) updated for ticket ${issue.key}: ${crNumber}`);
                    }
                }
            }
        }

        res.status(200).send('SR Number and CR Number (SalesForce CR) updated successfully!');
    } catch (err) {
        console.error('Error syncing SR Number and CR Number (SalesForce CR):', err.message);
        res.status(500).send('Error syncing SR Number and CR Number (SalesForce CR)');
    }
});

// Function to sync SR Number from Linked Tickets ***
app.post('/api/tickets/sync-sr-number', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues;

    try {
        for (let issue of allIssues) {
            if (!issue.fields.customfield_17643) {
                const linkedIssues = issue.fields.issuelinks;

                if (linkedIssues && linkedIssues.length > 0) {
                    const outwardIssue = linkedIssues[0]?.outwardIssue;

                    if (outwardIssue) {
                        const linkedIssueDetails = await fetchIssueDetails(outwardIssue.id);

                        if (linkedIssueDetails && linkedIssueDetails.fields.customfield_17801) {
                            const srNumber = extractSRCRNumber(linkedIssueDetails.fields.customfield_17801);

                            await updateIssueField(issue.id, { customfield_17643: srNumber });
                            console.log(`SR Number updated for ticket ${issue.key}: ${srNumber}`);
                        }
                    }
                }
            }
        }

        res.status(200).send('SR Number updated successfully!');
    } catch (err) {
        console.error('Error syncing SR Number:', err.message);
        res.status(500).send('Error syncing SR Number');
    }
});

// Function to sync CR Number(SalesForce CR) from Linked Tickets ***
app.post('/api/tickets/sync-cr-number', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues;

    try {
        for (let issue of allIssues) {
            if (!issue.fields.customfield_17687) {
                const linkedIssues = issue.fields.issuelinks;

                if (linkedIssues && linkedIssues.length > 0) {
                    const outwardIssue = linkedIssues[0]?.outwardIssue;

                    if (outwardIssue) {
                        const linkedIssueDetails = await fetchIssueDetails(outwardIssue.id);

                        if (linkedIssueDetails && linkedIssueDetails.fields.customfield_17800) {
                            const srNumber = extractSRCRNumber(linkedIssueDetails.fields.customfield_17800);

                            await updateIssueField(issue.id, { customfield_17687: srNumber });
                            console.log(`CR Number(SalesForce CR) updated for ticket ${issue.key}: ${srNumber}`);
                        }
                    }
                }
            }
        }

        res.status(200).send('CR Number(SalesForce CR) updated successfully!');
    } catch (err) {
        console.error('Error syncing CR Number(SalesForce CR):', err.message);
        res.status(500).send('Error syncing CR Number(SalesForce CR)');
    }
});

// Helper function to extract SR number & CR Number(SalesForce CR) from HTML string, only extract numbers
const extractSRCRNumber = (htmlString) => {
    const match = htmlString.match(/>(\d+)</);
    return match ? match[1] : '';
};

// Helper function to fetch issue details
const fetchIssueDetails = async (issueId) => {
    try {
        const response = await axios.get(`${JIRA_URL}/rest/api/2/issue/${issueId}`, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching issue ${issueId}:`, error);
        return null;
    }
};

// Helper function to update issue field
const updateIssueField = async (issueId, fields) => {
    try {
        const response = await axios.put(`${JIRA_URL}/rest/api/2/issue/${issueId}`, { fields }, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating issue ${issueId}:`, error);
        return null;
    }
};

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


