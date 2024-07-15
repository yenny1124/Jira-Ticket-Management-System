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
            const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}&fields=comment,summary,issuetype,assignee,reporter,status,priority,labels`; // Include comments in the response

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

// fetching a ticket (By issueKey)
app.get('/api/tickets/issue/:issuekey', async (req, res) => {
    const issueKey = req.params.issuekey;
    const url = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;
    console.log(`Making GET request to URL: ${url}`);
    console.log(`Fetching ticket with issue key: ${issueKey}`);

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        console.log(`Received response status: ${response.status}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching comments: ${error.message}`); // Log the error message
        res.status(500).json({ error: error.message });
    }
});

// fetching a comment from a ticket (By issueKey)
app.get('/api/tickets/issue/:issuekey/comment', async (req, res) => {
    const issueKey = req.params.issuekey;
    const url = `${JIRA_URL}/rest/api/2/issue/${issueKey}/comment`;

    console.log(`Making GET request to URL: ${url}`);
    console.log(`Fetching comments for ticket with issue key: ${issueKey}`);

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Accept': 'application/json'
            }
        });

        console.log(`Received response status: ${response.status}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error fetching comments: ${error.message}`); // Log the error message
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
            const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}&fields=comment,summary,issuetype,assignee,reporter,status,priority,labels`; // Include comments in the response

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

// Adding a comment to a ticket by issueKey
app.post('/api/tickets/issue/:issuekey/comment', async (req, res) => {
    const issueKey = req.params.issuekey;
    const url = `${JIRA_URL}/rest/api/2/issue/${issueKey}/comment`;
    const comment = {
        body: req.body.body
    };


    console.log(`Making POST request to URL: ${url}`);
    console.log(`Comment payload: ${JSON.stringify(comment)}`);
    console.log(`Adding comment to ticket with issue key: ${issueKey}`)

    try {
        const response = await axios.post(url, comment, {
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });

        console.log(`Received response status: ${response.status}`);
        res.json(response.data);
    } catch (error) {
        console.error(`Error adding comment: ${error.message}`);
        console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        res.status(500).json({ error: error.message });
    }

})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
