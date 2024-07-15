const axios = require('axios');

const JIRA_URL = "https://jira-qa.spirenteng.com";
const SEARCH_ISSUE_FMT_STR = `${JIRA_URL}/rest/api/2/search?jql=%s&startAt=%d&maxResults=%d`;

const API_TOKEN = "MjQzNDYyMDk5OTE0OmlLkGEVs19rBbJTVBWp7XWFPiMj";
const EMAIL = "Yeeun.Choi@spirent.com";

const jqlQuery = "(project = LS OR project = ORAN) AND \"Target Release\" in (LS-24.2) and Component in (\"TAS\", TC-GUI)"; // Example JQL query
const maxResults = 50; // Number of results to fetch per request
fetchAllIssues(jqlQuery, maxResults);

async function fetchAllIssues(jqlQuery, maxResults) {
    let startAt = 0;
    let moreResults = true;

    while (moreResults) {
        const encodedJql = encodeURIComponent(jqlQuery);
        const url = `${JIRA_URL}/rest/api/2/search?jql=${encodedJql}&startAt=${startAt}&maxResults=${maxResults}`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${API_TOKEN}`,
                    'Accept': 'application/json'
                }
            });

            const jsonNode = response.data;
            console.log("Search results:", JSON.stringify(jsonNode, null, 2));

            const issues = jsonNode.issues;
            if (!issues || issues.length === 0) {
                moreResults = false;
            } else {
                for (const issue of issues) {
                    const key = issue.key;
                    const summary = issue.fields.summary;
                    console.log(`Issue key: ${key}, Summary: ${summary}`);
                }
                startAt += maxResults;
                if (issues.length < maxResults) {
                    moreResults = false;
                }
            }
        } catch (error) {
            console.error("Error fetching issues:", error);
            moreResults = false;
        }
    }
}
