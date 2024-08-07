const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Import the cors module
const app = express();
const dotenv = require('dotenv');
dotenv.config();
const port = process.env.PORT || 5000;

const JIRA_URL = process.env.JIRA_URL;
const API_TOKEN = process.env.API_TOKEN;
const MAX_FETCHED_ISSUES = 100; // Limit to prevent infinite fetching
// const jqlQuery = "(project = LS OR project = ORAN) AND \"Target Release\" in (LS-24.2) and Component in (\"TAS\", TC-GUI)"; // Example JQL query

// Enable CORS for all routes
app.use(cors()); 
// a middleware is responsible for parsing JSON formatted request bodies 
// and making the parsed data available in req.body.
app.use(express.json()); 
const fs = require('fs');
const path = require('path');

// Basic route to check if the server is running
app.get('/', (req, res) => {
    res.send('Welcome to the Landslide Jira Management Automation API. Use /api/tickets to get the tickets.');
});

// Middleware to fetch tickets (should be initialized first before it's used)
const fetchTicketsMiddleware = async (req, res, next) => {
    // Get the JQL query from the request's query parameters
    const jqlQuery = req.query.jql; 

    // If no JQL query is provided, return a 400 error
    if (!jqlQuery) {
        return res.status(400).json({ error: 'JQL query is required' });
    }

    // Get the maxResults from the query parameters or default to 50
    const maxResults = parseInt(req.query.maxResults) || 50;
    
    // Initialize the starting point for fetching results
    let startAt = 0;
    
    // Initialize an array to hold all fetched issues
    let allIssues = [];

    // Log the JQL query for debugging purposes
    console.log(`Fetching tickets with JQL: ${jqlQuery}`);

    try {
        // Loop until all issues are fetched or the limit is reached
        while (allIssues.length < MAX_FETCHED_ISSUES) {
            // Encode the JQL query to make it URL-safe
            const encodedJql = encodeURIComponent(jqlQuery);
            
            // Construct the URL for the Jira API request
            const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}&fields=*all`; // Include all fields in the response

            // Log the URL for debugging purposes
            console.log(`Making GET request to URL: ${url}`);
            
            // Make the GET request to the Jira API
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            });

            // Log the response status for debugging purposes
            console.log(`Received response status: ${response.status}`);
            
            // Get the data from the response
            const jsonNode = response.data;
            
            // Extract the issues from the response data
            const issues = jsonNode.issues;

            // If no issues are found, break the loop
            if (!issues || issues.length === 0) {
                console.log('No more issues found.');
                break;
            } else {
                // Add the fetched issues to the allIssues array
                allIssues = allIssues.concat(issues);
                
                // Log the number of issues fetched and the total fetched so far
                console.log(`Fetched ${issues.length} issues, total fetched: ${allIssues.length}`);
                
                // Increment the startAt variable for the next batch of results
                startAt += maxResults;
                
                // If fewer issues than maxResults are returned, break the loop
                if (issues.length < maxResults) {
                    break;
                }
            }
        }

        // Attach the fetched issues to the request object
        req.fetchedIssues = allIssues;
        
        // Call the next middleware function
        next();
    } catch (error) {
        // Log the error message for debugging purposes
        console.error(`Error fetching tickets: ${error.message}`);
        
        // Return a 500 error response
        res.status(500).json({ error: error.message });
    }
};

// Route to fetch tickets based on a JQL query
app.get('/api/tickets', fetchTicketsMiddleware, (req, res) => {
    res.json(req.fetchedIssues);
});

// Route to update the “components” field in tickets using a PUT request 
app.put('/api/tickets/updateComponents', fetchTicketsMiddleware, async (req, res) => {
    // Retrieve the tickets fetched by the fetchTicketsMiddleware function
    const allIssues = req.fetchedIssues; 
    
    // Extract the new components from the request body
    const newComponents = req.body.components; 

    // Iterate over each ticket to update the components field
    for (const issue of allIssues) {
        // Get the issue key for the current ticket
        const issueKey = issue.key;
        
        // Construct the URL for the Jira API request to update the ticket
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;
        
        // Create the data object containing the new components
        const updateData = { fields: { components: newComponents } };

        // Log the issue key being updated for debugging purposes
        console.log(`Updating components for ticket with issue key: ${issueKey}`);
        
        try {
            // Make the PUT request to the Jira API to update the ticket
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            // Log the response status for the update request
            console.log(`Components updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            // Log any error that occurs during the update request
            console.error(`Error updating components for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    // Send a JSON response indicating that all tickets were successfully updated
    res.json({ message: 'Components updated for all tickets successfully.' });
});

// Route to update the "Target Release (customfield_17644)" field in tickets using a PUT request
app.put('/api/tickets/updateTargetRelease', fetchTicketsMiddleware, async (req, res) => {
    // Retrieve the tickets fetched by the fetchTicketsMiddleware function
    const allIssues = req.fetchedIssues;
    
    // Extract the new value for customfield_17644 from the request body
    const newCustomField17644 = req.body.customfield_17644;
    
    // Iterate over each ticket to update the customfield_17644 field
    for (const issue of allIssues) {
        // Get the issue key for the current ticket
        const issueKey = issue.key;
        
        // Construct the URL for the Jira API request to update the ticket
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;
        
        // Create the data object containing the new value for customfield_17644
        const updateData = { fields: { customfield_17644: newCustomField17644 } };

        // Log the issue key being updated for debugging purposes
        console.log(`Updating customfield_17644 for ticket with issue key: ${issueKey}`);
        
        try {
            // Make the PUT request to the Jira API to update the ticket
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            
            // Log the response status for the update request
            console.log(`customfield_17644 updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            // Log any error that occurs during the update request
            console.error(`Error updating customfield_17644 for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    // Send a JSON response indicating that all tickets were successfully updated
    res.json({ message: 'customfield_17644 updated for all tickets successfully.' });
});

// Route to update the “Target Version (customfield_11200)” field in tickets using a PUT request
app.put('/api/tickets/updateTargetVersion', fetchTicketsMiddleware, async (req, res) => {
    // Retrieve the tickets fetched by the fetchTicketsMiddleware function
    const allIssues = req.fetchedIssues; 
    
    // Extract the new value for customfield_11200 from the request body
    const newCustomField11200 = req.body.customfield_11200; 

    // Iterate over each ticket to update the customfield_11200 field
    for (const issue of allIssues) {
        // Get the issue key for the current ticket
        const issueKey = issue.key;

        // Construct the URL for the Jira API request to update the ticket
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;

        // Create the data object containing the new value for customfield_11200
        const updateData = { fields: { customfield_11200: newCustomField11200 } };

        // Log the issue key being updated for debugging purposes
        console.log(`Updating customfield_11200 for ticket with issue key: ${issueKey}`);

        try {
            // Make the PUT request to the Jira API to update the ticket
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`, // Use the API token for authorization
                    'Accept': 'application/json', // Expect a JSON response
                    'Content-Type': 'application/json' // Send JSON data
                }
            });

            // Log the response status for the update request
            console.log(`customfield_11200 updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            // Log any error that occurs during the update request
            console.error(`Error updating customfield_11200 for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    // Send a JSON response indicating that all tickets were successfully updated
    res.json({ message: 'customfield_11200 updated for all tickets successfully.' });
});


// Route to update the “SR Number (customfield_17643)” field in tickets using a PUT request
app.put('/api/tickets/updateSRnumber', fetchTicketsMiddleware, async (req, res) => {
    // Retrieve the tickets fetched by the fetchTicketsMiddleware function
    const allIssues = req.fetchedIssues;

    // Extract the new value for customfield_17643 from the request body
    const newCustomField17643 = req.body.customfield_17643;

    // Iterate over each ticket to update the customfield_17643 field
    for (const issue of allIssues) {
        // Get the issue key for the current ticket
        const issueKey = issue.key;

        // Construct the URL for the Jira API request to update the ticket
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;

        // Create the data object containing the new value for customfield_17643
        const updateData = { fields: { customfield_17643: newCustomField17643 } };

        // Log the issue key being updated for debugging purposes
        console.log(`Updating customfield_17643 for ticket with issue key: ${issueKey}`);

        try {
            // Make the PUT request to the Jira API to update the ticket
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`, // Use the API token for authorization
                    'Accept': 'application/json', // Expect a JSON response
                    'Content-Type': 'application/json' // Send JSON data
                }
            });

            // Log the response status for the update request
            console.log(`customfield_17643 updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            // Log any error that occurs during the update request
            console.error(`Error updating customfield_17643 for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    // Send a JSON response indicating that all tickets were successfully updated
    res.json({ message: 'customfield_17643 updated for all tickets successfully.' });
});


// Route to update the “SalesForce CR (customfield_17687)” field in tickets using a PUT request
app.put('/api/tickets/updateSalesForceCR', fetchTicketsMiddleware, async (req, res) => {
    // Retrieve the tickets fetched by the fetchTicketsMiddleware function
    const allIssues = req.fetchedIssues;

    // Extract the new value for customfield_17687 from the request body
    const newCustomField17687 = req.body.customfield_17687;

    // Iterate over each ticket to update the customfield_17687 field
    for (const issue of allIssues) {
        // Get the issue key for the current ticket
        const issueKey = issue.key;

        // Construct the URL for the Jira API request to update the ticket
        const updateUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}`;

        // Create the data object containing the new value for customfield_17687
        const updateData = { fields: { customfield_17687: newCustomField17687 } };

        // Log the issue key being updated for debugging purposes
        console.log(`Updating customfield_17687 for ticket with issue key: ${issueKey}`);

        try {
            // Make the PUT request to the Jira API to update the ticket
            const response = await axios.put(updateUrl, updateData, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`, // Use the API token for authorization
                    'Accept': 'application/json', // Expect a JSON response
                    'Content-Type': 'application/json' // Send JSON data
                }
            });

            // Log the response status for the update request
            console.log(`customfield_17687 updated for ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            // Log any error that occurs during the update request
            console.error(`Error updating customfield_17687 for ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    // Send a JSON response indicating that all tickets were successfully updated
    res.json({ message: 'customfield_17687 updated for all tickets successfully.' });
});

// Route to add comments to all tickets fetched by JQL query
app.post('/api/tickets/comments', fetchTicketsMiddleware, async (req, res) => {
    // Retrieve the tickets fetched by the fetchTicketsMiddleware function
    const allIssues = req.fetchedIssues;

    // Extract the comment body from the request body
    const commentBody = req.body.body;

    // Iterate over each ticket to add the comment
    for (const issue of allIssues) {
        // Get the issue key for the current ticket
        const issueKey = issue.key;

        // Construct the URL for the Jira API request to add a comment to the ticket
        const commentUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}/comment`;

        // Create the comment object containing the comment body
        const comment = { body: commentBody };

        // Log the issue key being updated for debugging purposes
        console.log(`Adding comment to ticket with issue key: ${issueKey}`);

        try {
            // Make the POST request to the Jira API to add the comment to the ticket
            const response = await axios.post(commentUrl, comment, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`, // Use the API token for authorization
                    'Accept': 'application/json', // Expect a JSON response
                    'Content-Type': 'application/json' // Send JSON data
                }
            });

            // Log the response status for the comment addition request
            console.log(`Comment added to ${issueKey}, response status: ${response.status}`);
        } catch (error) {
            // Log any error that occurs during the comment addition request
            console.error(`Error adding comment to ${issueKey}: ${error.message}`);
            console.error(`Error response data: ${JSON.stringify(error.response.data)}`);
        }
    }

    // Send a JSON response indicating that comments were successfully added to all tickets
    res.json({ message: 'Comments added to all tickets successfully.' });
});

// Function to sync SR Number and CR Number from Linked Tickets 
app.post('/api/tickets/sync-sr-cr-numbers', fetchTicketsMiddleware, async (req, res) => {
    // tickets fetched by middleware function (fetchTicketsMiddleware)
    const allIssues = req.fetchedIssues; 

    // If no tickets are fetched, log a message and return a JSON response
    if (allIssues.length === 0) {
        console.log('No fetched tickets found.');
        return res.json({ message: 'There are no fetched tickets.' });
    }

    // Initialize a log string to record the update process
    let updateLog = "Sync SR/CRs to Bugs Updates:\n";

    try {
        // Iterate over each fetched ticket
        for (let issue of allIssues) {
            // Get the linked issues for the current ticket
            const linkedIssues = issue.fields.issuelinks;

            // Check if there are any linked issues
            if (linkedIssues && linkedIssues.length > 0) {
                // Get the outward issue of the first linked issue
                const outwardIssue = linkedIssues[0]?.outwardIssue;

                // If an outward issue exists, fetch its details
                if (outwardIssue) {
                    const linkedIssueDetails = await fetchIssueDetails(outwardIssue.id);

                    // Log the current issue and its linked issue
                    updateLog += `${issue.key}    ${issue.fields.summary}\n`;
                    updateLog += `--Linked to: ${linkedIssueDetails.key} ${linkedIssueDetails.fields.summary}\n`;

                    // Initialize variables to hold the SR and CR numbers
                    let srNumber = "", crNumber = "";

                    // Sync SR Number if empty
                    if (!issue.fields.customfield_17643 && linkedIssueDetails && linkedIssueDetails.fields.customfield_17801) {
                        srNumber = extractSRCRNumber(linkedIssueDetails.fields.customfield_17801);
                        await updateIssueField(issue.id, { customfield_17643: srNumber });

                        // If SR number is updated, log the update
                        if(srNumber!=""){
                            console.log(`SR Number updated for ticket ${issue.key}: ${srNumber}`);
                            updateLog += `---SalesForce SR: ${srNumber}\n`;
                        }
                    }

                    // Sync CR Number (SalesForce CR) if empty
                    if (!issue.fields.customfield_17687 && linkedIssueDetails && linkedIssueDetails.fields.customfield_17800) {
                        crNumber = extractSRCRNumber(linkedIssueDetails.fields.customfield_17800);
                        await updateIssueField(issue.id, { customfield_17687: crNumber });

                        // If CR number is updated, log the update
                        if(crNumber!=""){
                            console.log(`CR Number (SalesForce CR) updated for ticket ${issue.key}: ${crNumber}`);
                            updateLog += `---SalesForce CR: ${crNumber}\n`;
                        }
                    }

                    // If neither SR nor CR Number was updated, log the skip
                    if (srNumber==""&&crNumber=="") {
                        updateLog += `---SKIPPED DEFECT HAS NO SR/CR\n`;
                    }
                }
            }
        }
        updateLog += "\n";

        // Write the update log to a file
        fs.appendFileSync('ls-jmas.txt', updateLog);

        // Send a success response
        res.status(200).send('SR Number and CR Number (SalesForce CR) updated successfully!');
    } catch (err) {
        // Log and send an error response if something goes wrong
        console.error('Error syncing SR Number and CR Number (SalesForce CR):', err.message);
        res.status(500).send('Error syncing SR Number and CR Number (SalesForce CR)');
    }
});

// Endpoint to serve the log file for Sync SR/CRs to Bugs
app.get('/api/tickets/sync-sr-cr-numbers/logs', (req, res) => {
    // Define the path to the log file
    const logFilePath = path.join(__dirname, 'ls-jmas.txt');

    // Read the content of the log file
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        // If there is an error reading the file, log the error and send a 500 status response
        if (err) {
            console.error('Error reading log file:', err.message);
            return res.status(500).send('Error reading log file');
        }
        // If the file is read successfully, send its content in the response
        res.send(data);
    });
});

// PUT method to add or update a comment with each assignee in tickets
app.put('/api/tickets/comment-for-missing-primary-component', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues; // Tickets fetched by middleware function (fetchTicketsMiddleware)
    
    // Check if there are no fetched tickets
    if (allIssues.length === 0) {
        console.log('No fetched tickets found.');
        return res.json({ message: 'There are no fetched tickets.' });
    }

    // Initialize the update log
    let updateLog = "Missing Primary Component Updates:\n";
    
    // Template for the co  mment to be added
    const commentTemplate = "@assignee, please add the Primary Component to the Component field. One of TAS, TS, TC-GUI, Documentation, CI, “Mobile App”, Licensing, Build, \"License Tool or Server\", or System.";

    // Loop through each fetched issue
    for (const issue of allIssues) {
        const issueKey = issue.key; // Issue key of the ticket
        const assignee = issue.fields.assignee ? issue.fields.assignee.displayName : 'assignee'; // Assignee of the ticket, or 'assignee' if not assigned
        const commentBody = commentTemplate.replace('@assignee', `@${assignee}`); // Replace '@assignee' in the template with the actual assignee's display name
        const commentUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}/comment`; // URL to add a comment to the ticket
        const comment = { body: commentBody }; // Comment object to be added
            
        console.log(`Adding comment to ticket with issue key: ${issueKey}`);
        
        // Try to add the comment to the ticket
        try {
            const response = await axios.post(commentUrl, comment, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            // Update the log with the successful comment addition
            updateLog += `${issue.key}    ${issue.fields.summary}\n`;
            updateLog += `---Comment added - assignee: @${assignee}\n`;
            console.log(`${issue.key}    Comment added, response status: ${response.status}`);
        } catch (error) {
            // Update the log with the failed comment addition
            updateLog += `---Failed to add comment - assignee: @${assignee} - Error: ${error.message}\n`;
            console.error(`Error adding comment to ${issueKey}: ${error.message}`);
        }

    }
    updateLog += "\n";

    // Write the update log to a file
    try {
        fs.appendFileSync('ls-jmas.txt', updateLog);
    } catch (fileError) {
        console.error('Error writing log file:', fileError.message);
    }

    // Send a response indicating the comments were added successfully
    res.json({ message: 'Comments added to all tickets successfully.' });
});

// Endpoint to serve the log file for Missing Primary Component
app.get('/api/tickets/comment-for-missing-primary-component/logs', (req, res) => {
    const logFilePath = path.join(__dirname, 'ls-jmas.txt'); // Define the path to the log file

    // Read the log file asynchronously
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        // If there is an error reading the file, log the error and send a 500 response
        if (err) {
            console.error('Error reading log file:', err.message);
            return res.status(500).send('Error reading log file');
        }
        // If the file is read successfully, send its content as the response
        res.send(data);
    });
});

// PUT method to add or update a comment with each assignee in tickets
app.put('/api/tickets/comment-for-cloned-defects-still-defects', fetchTicketsMiddleware, async (req, res) => {
    const allIssues = req.fetchedIssues; // tickets fetched by middleware function (fetchTicketsMiddleware)
    
    // Check if there are no fetched tickets
    if (allIssues.length === 0) {
        console.log('No fetched tickets found.');
        return res.json({ message: 'There are no fetched tickets.' });
    }

    let updateLog = "Cloned Defects still Defects Updates:\n"; // Initialize log for updates
    // Template for the comment to be added
    const commentTemplate = "@assignee, please convert/move your cloned Defect into a Bug and follow the standard process. You seem to have missed the step to move the Defect to a Bug.";

    // Iterate over each fetched issue
    for (const issue of allIssues) {
        const issueKey = issue.key; // Get the issue key
        const assignee = issue.fields.assignee ? issue.fields.assignee.displayName : 'assignee'; // Get the assignee
        const commentBody = commentTemplate.replace('@assignee', `@${assignee}`); // Customize the comment with the assignee's name
        const commentUrl = `${JIRA_URL}/rest/api/2/issue/${issueKey}/comment`; // URL to add the comment
        const comment = { body: commentBody }; // Prepare the comment body
            
        console.log(`Adding comment to ticket with issue key: ${issueKey}`);
        try {
            // Make a POST request to add the comment
            const response = await axios.post(commentUrl, comment, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });
            // Update the log with the successful comment addition
            updateLog += `${issue.key}    ${issue.fields.summary}\n`;
            updateLog += `---Comment added - assignee: @${assignee}\n`;
            console.log(`${issue.key}    Comment added, response status: ${response.status}`);
        } catch (error) {
            // Update the log with the failed comment addition
            updateLog += `---Failed to add comment - assignee: @${assignee} - Error: ${error.message}\n`;
            console.error(`Error adding comment to ${issueKey}: ${error.message}`);
        }
    }
    updateLog += "\n";

    // Write the update log to a file
    try {
        fs.appendFileSync('ls-jmas.txt', updateLog);
    } catch (fileError) {
        console.error('Error writing log file:', fileError.message);
    }

    // Send a JSON response indicating success
    res.json({ message: 'Comments added to all tickets successfully.' });
});

// Endpoint to serve the log file for Cloned Defects still Defects 
app.get('/api/tickets/comment-for-cloned-defects-still-defects/logs', (req, res) => {
    // Define the path to the log file
    const logFilePath = path.join(__dirname, 'ls-jmas.txt');
    
    // Read the contents of the log file
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        // Handle any errors that occur during file reading
        if (err) {
            console.error('Error reading log file:', err.message);
            return res.status(500).send('Error reading log file');
        }
        // Send the contents of the log file as the response
        res.send(data);
    });
});

// Function to update Customer Information (LS Customer) from Linked Tickets *** need to modify
app.post('/api/tickets/update-customer-info', fetchTicketsMiddleware, async (req, res) => {
    // tickets fetched by middleware function (fetchTicketsMiddleware)
    const allIssues = req.fetchedIssues; 

    // If no tickets are fetched, log a message and return a JSON response
    if (allIssues.length === 0) {
        console.log('No fetched tickets found.');
        return res.json({ message: 'There are no fetched tickets.' });
    }

    // Initialize a log string to record the update process
    let updateLog = "Update Customer Information Updates:\n";

    try {
        // Iterate over each fetched ticket
        for (let issue of allIssues) {
            // Get the linked issues for the current ticket
            const linkedIssues = issue.fields.issuelinks;

            // Check if there are any linked issues
            if (linkedIssues && linkedIssues.length > 0) {
                // Get the outward issue of the first linked issue
                const outwardIssue = linkedIssues[0]?.outwardIssue;

                // If an outward issue exists, fetch its details
                if (outwardIssue) {
                    const linkedIssueDetails = await fetchIssueDetails(outwardIssue.id);

                    // Log the current issue and its linked issue
                    updateLog += `${issue.key}    ${issue.fields.summary}\n`;
                    updateLog += `--Linked to: ${linkedIssueDetails.key} ${linkedIssueDetails.fields.summary}\n`;

                    // Initialize a variable to hold LS Customer
                    let lsCustomer = "";

                    // Update LS Customer(customfield_17674) if empty
                    if (!issue.fields.customfield_17674 && linkedIssueDetails && linkedIssueDetails.fields.customfield_15507) {
                        lsCustomer = extractLSCustomer(linkedIssueDetails.fields.customfield_15507);
                        await updateIssueField(issue.id, { customfield_17674: lsCustomer});

                        // If LS Customer is updated, log the update
                        if(lsCustomer!=""){
                            console.log(`LS Customer updated for ticket ${issue.key}: ${lsCustomer}`);
                            updateLog += `---LS Customer: ${lsCustomer}\n`;
                        }
                    }

                    // If no LS Customer was updated, log the skip
                    if (lsCustomer=="") {
                        updateLog += `---SKIPPED DEFECT HAS NO LS Customer\n`;
                    }
                }
            }
        }
        updateLog += "\n";

        // Write the update log to a file
        fs.appendFileSync('ls-jmas.txt', updateLog);

        // Send a success response
        res.status(200).send('Customer Information (LS Customer) updated successfully!');
    } catch (err) {
        // Log and send an error response if something goes wrong
        console.error('Error updating Customer Information (LS Customer):', err.message);
        res.status(500).send('Error updating Customer Information (LS Customer)');
    }

});

// Helper function to extract SR number & CR Number (SalesForce CR) from an HTML string
// This function specifically looks for numbers within HTML tags
const extractSRCRNumber = (htmlString) => {
    // Use a regular expression to find a number between HTML tags
    // The regex pattern `>(\d+)<` looks for a '>' followed by one or more digits (\d+), and then a '<'
    const match = htmlString.match(/>(\d+)</);
    
    // If a match is found, return the first capturing group (the number)
    // If no match is found, return an empty string
    return match ? match[1] : '';
};

// Helper function to extract LS Customer (4th item in Linked Service Requests) from an HTML string
const extractLSCustomer = (htmlString) => {
    // Split the string by the separator, in this case, " - "
    const items = htmlString.split(' - ');
    
    // Check if there are at least 4 items
    if (items.length >= 4) {
        // Return the 4th item
        return items[3].trim();
    }
    
    // Return an empty string if there are less than 4 items
    return '';
};


// Helper function to fetch issue details from the Jira API
const fetchIssueDetails = async (issueId) => {
    try {
        // Send a GET request to the Jira API to fetch issue details
        // The URL includes the issueId to specify which issue to fetch
        const response = await axios.get(`${JIRA_URL}/rest/api/2/issue/${issueId}`, {
            // Set the required headers for authorization and content type
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`, // Use the API token for authentication
                'Accept': 'application/json'            // Expect a JSON response
            }
        });

        // Return the data from the response
        return response.data;
    } catch (error) {
        // If there's an error, log it to the console
        console.error(`Error fetching issue ${issueId}:`, error);

        // Return null to indicate that fetching the issue details failed
        return null;
    }
};

// Helper function to update issue field in the Jira API
const updateIssueField = async (issueId, fields) => {
    try {
        // Send a PUT request to the Jira API to update issue fields
        // The URL includes the issueId to specify which issue to update
        const response = await axios.put(`${JIRA_URL}/rest/api/2/issue/${issueId}`, { fields }, {
            // Set the required headers for authorization and content type
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`, // Use the API token for authentication
                'Content-Type': 'application/json'      // Set the content type to JSON
            }
        });

        // Return the data from the response
        return response.data;
    } catch (error) {
        // If there's an error, log it to the console
        console.error(`Error updating issue ${issueId}:`, error);

        // Return null to indicate that updating the issue field failed
        return null;
    }
};

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on ${process.env.BASE_URL}`);
});


