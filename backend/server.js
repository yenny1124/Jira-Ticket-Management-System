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

// fetching all tickets (By entering JQL query)
app.get('/api/tickets', async (req, res) => {
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

        res.json(allIssues);
    } catch (error) {
        console.error(`Error fetching tickets: ${error.message}`); // Log the error message
        res.status(500).json({ error: error.message });
    }
});

// Update “components” field in tickets using a PUT request 
app.put('/api/tickets/updateComponents', async (req, res) => {
    const jqlQuery = req.query.jql || 'project = LS'; // Use the JQL query from the request
    const maxResults = parseInt(req.query.maxResults) || 50;
    const newComponents = req.body.components; // The new components to be set
    let startAt = 0;
    let allIssues = [];

    console.log(`Fetching tickets with JQL: ${jqlQuery}`); // Log the JQL query

    try {
        while (allIssues.length < MAX_FETCHED_ISSUES) {
            const encodedJql = encodeURIComponent(jqlQuery);
            const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}&fields=*all`;

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
    } catch (error) {
        console.error(`Error fetching tickets: ${error.message}`); // Log the error message
        res.status(500).json({ error: error.message });
    }
});

// Update "Target Release (customfield_17644)" field in tickets using a PUT request
app.put('/api/tickets/updateTargetRelease', async (req, res) => {
    const jqlQuery = req.query.jql || 'project = LS'; // Use the JQL query from the request
    const maxResults = parseInt(req.query.maxResults) || 50;
    const newCustomField17644 = req.body.customfield_17644; // The new value for customfield_17644
    let startAt = 0;
    let allIssues = [];

    console.log(`Fetching tickets with JQL: ${jqlQuery}`); // Log the JQL query

    try {
        while (allIssues.length < MAX_FETCHED_ISSUES) {
            const encodedJql = encodeURIComponent(jqlQuery);
            const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}&fields=*all`;

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
    } catch (error) {
        console.error(`Error fetching tickets: ${error.message}`); // Log the error message
        res.status(500).json({ error: error.message });
    }
});

// Update “Target Version (customfield_11200)” field in tickets using a PUT request 

// Update “SR Number (customfield_17643)” field in tickets using a PUT request
app.put('/api/tickets/updateSRnumber', async (req, res) => {
    const jqlQuery = req.query.jql || 'project = LS'; // Use the JQL query from the request
    const maxResults = parseInt(req.query.maxResults) || 50;
    const newCustomField17643 = req.body.customfield_17643; // The new value for customfield_17643
    let startAt = 0;
    let allIssues = [];

    console.log(`Fetching tickets with JQL: ${jqlQuery}`); // Log the JQL query

    try {
        while (allIssues.length < MAX_FETCHED_ISSUES) {
            const encodedJql = encodeURIComponent(jqlQuery);
            const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}&fields=*all`;

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
    } catch (error) {
        console.error(`Error fetching tickets: ${error.message}`); // Log the error message
        res.status(500).json({ error: error.message });
    }
});


// Update “SalesForce CR (customfield_17687)” field in tickets using a PUT request
app.put('/api/tickets/updateSalesForceCR', async (req, res) => {
    const jqlQuery = req.query.jql || 'project = LS'; // Use the JQL query from the request
    const maxResults = parseInt(req.query.maxResults) || 50;
    const newCustomField17687 = req.body.customfield_17687; // The new value for customfield_17687
    let startAt = 0;
    let allIssues = [];

    console.log(`Fetching tickets with JQL: ${jqlQuery}`); // Log the JQL query

    try {
        while (allIssues.length < MAX_FETCHED_ISSUES) {
            const encodedJql = encodeURIComponent(jqlQuery);
            const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}&fields=*all`;

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
    } catch (error) {
        console.error(`Error fetching tickets: ${error.message}`); // Log the error message
        res.status(500).json({ error: error.message });
    }
});

// Adding comments to all tickets fetched by JQL query
// iterate over the fetched issues and add a comment to each ticket:
app.post('/api/tickets/comments', async (req, res) => {
    const jqlQuery = req.query.jql || 'project = LS'; // Use the JQL query from the request
    const maxResults = parseInt(req.query.maxResults) || 50;
    const commentBody = req.body.body; // The comment to be added
    let startAt = 0;
    let allIssues = [];

    console.log(`Fetching tickets with JQL: ${jqlQuery}`); // Log the JQL query

    try {
        while (allIssues.length < MAX_FETCHED_ISSUES) {
            const encodedJql = encodeURIComponent(jqlQuery);
            const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}&fields=*all`; // Include comments in the response

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
    }catch (error) {
        console.error(`Error fetching tickets: ${error.message}`); // Log the error message
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
