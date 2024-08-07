import React, { useState, useEffect } from 'react'; // Import necessary React hooks and modules
import axios from 'axios'; // Import axios for making HTTP requests
import Select from 'react-select'; // Import Select component from react-select for dropdowns
import Dropdown from 'react-bootstrap/Dropdown'; // Import Dropdown component from react-bootstrap
import DropdownButton from 'react-bootstrap/DropdownButton'; // Import DropdownButton component from react-bootstrap
import './automationlist.css'; // Import CSS for styling the component

// Define column options for the tickets table
const columnOptions = [
    { value: 'issuetype', label: 'Type' },
    { value: 'key', label: 'Key' },
    { value: 'summary', label: 'Summary' },
    { value: 'assignee', label: 'Assignee' },
    { value: 'status', label: 'Status' },
    { value: 'resolution', label: 'Resolution' },
    { value: 'labels', label: 'Labels' },
    { value: 'description', label: 'Description' },
    { value: 'created', label: 'Created' },
    { value: 'updated', label: 'Updated' },
    { value: 'duedate', label: 'Due' },
    { value: 'toolbar', label: 'Tool Bar' },
    { value: 'components', label: 'Components' },
    { value: 'targetrelease', label: 'Target Release' },
    { value: 'targetversion', label: 'Target Version' },
    { value: 'SRnumber', label: 'SR Number' },
    { value: 'salesforceCR', label: 'SalesForce CR' },
    { value: 'productLine/engproj/area', label: 'ProductLine/Eng Proj/Area' },
];

// Define filter options for the tickets
const filters = [
    { name: 'Test Filter', jql: 'assignee = ychoi' },
    { name: 'Missing Primary Component', jql: 'filter = CurrentRelease AND status not in (Open, Targeted, Committed, Declined, Published, "Validated/Completed") AND component not in (TAS, TS, TC-GUI, Documentation, CI, "Mobile App", Licensing, Build, "License Tool or Server", System) AND type != Task AND type != Epic' },
    { name: 'Cloned Defects still Defects', jql: 'filter = CurrentRelease AND (issueFunction in linkedIssuesOf(\"type=Defect\", \"is cloned by\")) and type =Defect' },
    { name: 'Sync SR/CRs to Bugs', jql: "project = LS AND (issueFunction in linkedIssuesOf(\"type=Defect\", \"is cloned by\")) and (\"SR Number\" is EMPTY OR \"SalesForce CR\" is EMPTY)" },
    { name: 'Update Customer Information', jql: 'filter = CurrentRelease AND type = Bug AND (issueFunction in linkedIssuesOf("type=Defect", "is cloned by")) and "LS Customer" is EMPTY' }
];

const AutomationList = () => {
    const [tickets, setTickets] = useState([]); // State to store fetched tickets
    const [jql, setJql] = useState(null); // State to store the JQL query
    const [error, setError] = useState(null); // State to store any errors
    const [logContent, setLogContent] = useState(''); // State to store log content
    const [selectedColumns, setSelectedColumns] = useState(columnOptions.map(option => option.value)); // Initially select all columns
    const [selectedFilter, setSelectedFilter] = useState(null); // State to store the selected filter
    const [successMessage, setSuccessMessage] = useState(''); // State to store success messages

    // Function to fetch tickets based on a JQL query
    const fetchTickets = async (query) => {
        setError(null); // Reset error state
        try {
            // Make a GET request to fetch tickets
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tickets`, {
                params: { jql: query }
            });
            setTickets(response.data); // Update tickets state with the fetched data
        } catch (err) {
            setError(err.message); // Update error state with the error message
        }
    };

    // Function to handle search button click
    const handleSearch = () => {
        fetchTickets(jql); // Fetch tickets with the current JQL query
    };

    // Function to handle selecting a filter
    const handleSelectFilter = (selectedOption) => {
        const filterJql = selectedOption ? selectedOption.value : ''; // Get the JQL query from the selected filter
        setJql(filterJql); // Set the JQL query state
        fetchTickets(filterJql); // Fetch tickets with the selected filter's JQL query
        setSelectedFilter(selectedOption); // Set the selected filter state
    };

    // Function to handle selecting columns
    const handleColumnChange = (columnValue) => {
        const updatedColumns = selectedColumns.includes(columnValue)
            ? selectedColumns.filter(col => col !== columnValue) // Remove column if already selected
            : [...selectedColumns, columnValue]; // Add column if not selected
        setSelectedColumns(updatedColumns); // Update selected columns state
    };

    // Function to format descriptions, handling Jira markup
    const formatDescription = (description) => {
        if (!description) return null; // Return null if description is empty
    
        // Replace {code:java} and {code} with <pre><code> tags for code formatting
        let formattedDescription = description
            .replace(/\{code:java\}/g, '<pre><code class="language-java">')
            .replace(/\{code\}/g, '</code></pre>');
    
        // Replace Jira image markup with HTML img tags
        formattedDescription = formattedDescription.replace(
            /!(\S+\.(png|jpg|jpeg|gif))\|width=(\d+),height=(\d+)!/g,
            (match, src, extension, width, height) => {
                return `<img src="${src}" width="${width}" height="${height}" />`;
            }
        );
    
        // Replace Jira document markup with HTML anchor tags
        formattedDescription = formattedDescription.replace(
            /!(\S+\.(pdf))!/g,
            (match, src, extension) => {
                return `<a href="${src}" target="_blank">${src}</a>`;
            }
        );
    
        // Return the formatted description as raw HTML
        return { __html: formattedDescription };
    };

    // Function to format date values
    const formatDate = (dateString) => {
        if (!dateString) return ''; // Return an empty string if dateString is null or undefined
        const date = new Date(dateString); // Create a new Date object
        const day = date.getDate().toString().padStart(2, '0'); // Get day and pad with leading zero if needed
        const month = date.toLocaleString('default', { month: 'short' }); // Get month name in short format
        const year = date.getFullYear(); // Get full year
        return `${day}/${month}/${year}`; // Return formatted date string
    };

    // Function to handle syncing SR/CRs to Bugs
    const handleSyncSRCRtoBugs = async (event) => {
        event.preventDefault(); // Prevent default form submission
        setError(null); // Reset error state
        setSuccessMessage(null); // Clear previous success message
        try {
            // Make a POST request to sync SR/CR numbers
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/tickets/sync-sr-cr-numbers`, null, {
                params: {
                    jql: 'project = LS AND (issueFunction in linkedIssuesOf("type=Defect", "is cloned by")) and ("SR Number" is EMPTY OR "SalesForce CR" is EMPTY)'
                }
            });
            console.log(response.data); // Debugging line
            setSuccessMessage('SR/CR Numbers synced successfully!'); // Set success message
            console.log('Success message set'); // Debugging line
        } catch (error) {
            console.error('Error syncing SR/CR numbers:', error); // Log error
            setError('Error syncing SR/CR numbers'); // Set error message
        }
    };

    // Function to add comments for Missing Primary Component
    const handleCommentForMissingPrimaryComponent = async (event) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null); // Clear previous success message
        try {
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tickets/comment-for-missing-primary-component`, null, {
                params: {
                    jql: 'filter = CurrentRelease AND status not in (Open, Targeted, Committed, Declined, Published, "Validated/Completed") AND component not in (TAS, TS, TC-GUI, Documentation, CI, "Mobile App", Licensing, Build, "License Tool or Server", System) AND type != Task AND type != Epic'
                }
            });
            console.log(response.data); // Debugging line
            setSuccessMessage('Comments added for Missing Primary Component successfully.');
            console.log('Success message set'); // Debugging line
        } catch (err) {
            console.error('Error adding comments:', err);
            setError('Error adding comments');
        }
    };

    // Function to add comments for Cloned Defects Still Defects
    const handleCommentForClonedDefectsStillDefects = async (event) => {
        event.preventDefault(); // Prevent default form submission
        console.log('handleCommentForClonedDefectsStillDefects triggered'); // Debugging line
        setError(null); // Reset error state
        setSuccessMessage(null); // Clear previous success message
        try {
            console.log('Starting API request'); // Debugging line
            // Make a PUT request to add comments for Cloned Defects Still Defects
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tickets/comment-for-cloned-defects-still-defects`, null, {
                params: {
                    jql: 'filter = CurrentRelease AND (issueFunction in linkedIssuesOf("type=Defect", "is cloned by")) and type = Defect'
                }
            });
            console.log('Response:', response.data); // Debugging line
            setSuccessMessage('Comments added for Cloned Defects Still Defects successfully.'); // Set success message
            console.log('Success message set'); // Debugging line
        } catch (err) {
            console.error('Error adding comments:', err); // Log error
            setError('Error adding comments'); // Set error message
        }
    };


    // Function to fetch and display the log content for Sync SR/CRs to Bugs
    const fetchLogContentForSyncSRCRtoBugs = async () => {
        setError(null); // Reset error state
        try {
            // Make a GET request to fetch the log content
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tickets/sync-sr-cr-numbers/logs`);
            console.log('Log content fetched:', response.data); // Debugging line
            setLogContent(response.data); // Set log content state
            setSuccessMessage('Log file loaded successfully.'); // Set success message

            // Open the log content in a new window
            const logWindow = window.open('', '_blank'); // Open a new blank window
            logWindow.document.write('<html><head><title>Log Content</title></head><body>'); // Write HTML structure
            logWindow.document.write('<pre>' + response.data + '</pre>'); // Write log content in <pre> tag
            logWindow.document.write('</body></html>'); // Close HTML structure
            logWindow.document.close(); // Close the document to render content
        } catch (err) {
            setError(err.message); // Set error message
        }
    };

    // Function to fetch and display the log content for Missing Primary Component
    const fetchLogContentForMissingPrimaryComponent = async () => {
        setError(null); // Reset error state
        try {
            // Make a GET request to fetch the log content
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tickets/comment-for-missing-primary-component/logs`);
            console.log('Log content fetched:', response.data); // Debugging line
            setLogContent(response.data); // Set log content state
            setSuccessMessage('Log file loaded successfully.'); // Set success message

            // Open the log content in a new window
            const logWindow = window.open('', '_blank'); // Open a new blank window
            logWindow.document.write('<html><head><title>Log Content</title></head><body>'); // Write HTML structure
            logWindow.document.write('<pre>' + response.data + '</pre>'); // Write log content in <pre> tag
            logWindow.document.write('</body></html>'); // Close HTML structure
            logWindow.document.close(); // Close the document to render content
        } catch (err) {
            setError(err.message); // Set error message
        }
    };

    // Function to fetch and display the log content for Cloned Defects Still Defects
    const fetchLogContentForClonedDefectsStillDefects = async () => {
        setError(null); // Reset error state
        try {
            // Make a GET request to fetch the log content
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tickets/comment-for-cloned-defects-still-defects/logs`);
            console.log('Log content fetched:', response.data); // Debugging line
            setLogContent(response.data); // Set log content state
            setSuccessMessage('Log file loaded successfully.'); // Set success message

            // Open the log content in a new window
            const logWindow = window.open('', '_Is-jmas'); // Open a new blank window
            logWindow.document.write('<html><head><title>Log Content</title></head><body>'); // Write HTML structure
            logWindow.document.write('<pre>' + response.data + '</pre>'); // Write log content in <pre> tag
            logWindow.document.write('</body></html>'); // Close HTML structure
            logWindow.document.close(); // Close the document to render content
        } catch (err) {
            setError(err.message); // Set error message
        }
    };


  return (
    <div className="ticket-list">
        {/* <h1>Landslide Jira Management Automation System</h1> */}
        {/* Dropdown for filters & columns */}
        <div className='container1'>
            <Select
                options={filters.map(filter => ({ value: filter.jql, label: filter.name }))}
                value={selectedFilter}
                onChange={handleSelectFilter}
                className="filter-select"
                placeholder="Select a filter"
                isClearable
            />
            {/* Search bar */}
            <div className="input-container">
                <input
                    type="text"
                    value={jql}
                    onChange={(e) => setJql(e.target.value)}
                    className='search-input'
                    placeholder="Enter search query"
                />
                <button onClick={handleSearch}>Search</button>
            </div>
        </div>
        <div className='container2'>
            {/* Action Form for Missing Primary Component */}
            {selectedFilter?.label === 'Missing Primary Component' && (
                <form onSubmit={handleCommentForMissingPrimaryComponent}>
                    <div>
                        <button type="submit" className='action-button-missing-primary-component'>
                            Add Comment for Missing Primary Component
                        </button>
                    </div>
                </form>
            )}       
            {/* Button to fetch and view the log for Missing Primary Component */}
            {selectedFilter?.label === 'Missing Primary Component' && (
                <div>
                    <button onClick={fetchLogContentForMissingPrimaryComponent} className='view-log-button'>
                        View the Log
                    </button>
                </div>
            )}  

            {/* Action Form for Cloned Defects still Defects */}
            {selectedFilter?.label === 'Cloned Defects still Defects' && (
                <form onSubmit={handleCommentForClonedDefectsStillDefects}>
                    <div>
                        <button type="submit" className='action-button-cloned-defects-still-defects'>
                        Add Comment for Cloned Defects still Defects
                        </button>
                    </div>
                </form>
            )}        
            {/* Button to fetch and view the log for Cloned Defects still Defects */}
            {selectedFilter?.label === 'Cloned Defects still Defects' && (
                <div>
                    <button onClick={fetchLogContentForClonedDefectsStillDefects} className='view-log-button'>
                        View the Log
                    </button>
                </div>
            )}

            {/* Action Form for Sync SR/CRs to Bugs */}
            {selectedFilter?.label === 'Sync SR/CRs to Bugs' && (
                <form onSubmit={handleSyncSRCRtoBugs}>
                    <div>
                        <button type="submit" className='action-button-sync-sr-cr'>
                            Sync SR/CR Numbers from Linked Tickets
                        </button>
                    </div>
                </form>
            )}
            {/* Button to fetch and view the log for Sync SR/CRs to Bugs */}
            {selectedFilter?.label === 'Sync SR/CRs to Bugs' && (
                <div>
                    <button onClick={fetchLogContentForSyncSRCRtoBugs} className='view-log-button'>
                        View the Log
                    </button>
                </div>
            )}

            {/* Dropdown for columns */}
            <DropdownButton id="dropdown-basic-button" title="Columns" className='dropdown-columns'>
                {columnOptions.map(option => (
                    <Dropdown.Item
                        key={option.value}
                        onClick={() => handleColumnChange(option.value)}
                    >
                        <input
                            type="checkbox"
                            checked={selectedColumns.includes(option.value)}
                            onChange={() => handleColumnChange(option.value)}
                        />
                        {option.label}
                    </Dropdown.Item>
                ))}
            </DropdownButton>
        </div>
        {successMessage && <p>{successMessage}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {/* {logContent && <pre>{logContent}</pre>} */}
        
        {/* Table for columns by dropdown */}
        <table>
            <thead>
                <tr>
                    {selectedColumns.map(colValue => {
                        const col = columnOptions.find(option => option.value === colValue);
                        return <th key={col.value}>{col.label}</th>;
                    })}
                </tr>
            </thead>
            <tbody>
                {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                        {selectedColumns.map(colValue => {
                                const col = columnOptions.find(option => option.value === colValue);
                                switch (col.value) {
                                    case 'issuetype':
                                        return <td key={col.value}>{ticket.fields.issuetype?.name}</td>;
                                    case 'key':
                                        return (
                                            <td key={col.value}>
                                                <a 
                                                    href={`https://jira-qa.spirenteng.com/browse/${ticket.key}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                >
                                                    {ticket.key}
                                                </a>
                                            </td>
                                        );
                                    case 'summary':
                                        return <td key={col.value}>{ticket.fields.summary}</td>;
                                    case 'assignee':
                                        return <td key={col.value}>{ticket.fields.assignee?.displayName || 'Unassigned'}</td>;
                                    case 'status':
                                        return <td key={col.value}>{ticket.fields.status?.name}</td>;
                                    case 'resolution':
                                        return <td key={col.value}>{ticket.fields.resolution?.name || 'Unresolved'}</td>;
                                    case 'labels':
                                        return <td key={col.value}>{ticket.fields.labels.length > 0 ? ticket.fields.labels.join(', ') : 'None'}</td>;
                                    case 'description':
                                        return <td key={col.value} className="description" dangerouslySetInnerHTML={formatDescription(ticket.fields.description)}></td>;
                                    case 'created':
                                        return <td key={col.value}>{formatDate(ticket.fields.created)}</td>;
                                    case 'updated':
                                        return <td key={col.value}>{formatDate(ticket.fields.updated)}</td>;
                                    case 'duedate':
                                        return <td key={col.value}>{formatDate(ticket.fields.duedate)}</td>;
                                    case 'toolbar':
                                        return (
                                                <td key={col.value}>
                                                    <a 
                                                        href={`https://jira-qa.spirenteng.com/secure/EditIssue!default.jspa?id=${ticket.id}&returnUrl=https://jira-qa.spirenteng.com/secure/IssueNavAction!default.jspa`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    >
                                                    Edit
                                                    </a>
                                                    <br></br>
                                                    <a 
                                                        href={`https://jira-qa.spirenteng.com/secure/AddComment!default.jspa?id=${ticket.id}&returnUrl=https://jira-qa.spirenteng.com/rest/issueNav/1/issueTable/stable`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                    >
                                                    Comment
                                                    </a>
                                                </td>
                                        );     
                                    case 'components':
                                        return (
                                            <td key={col.value}>
                                                {ticket.fields.components && ticket.fields.components.length > 0
                                                    ? ticket.fields.components.map(component => component.name).join(', ')
                                                   : ''}
                                            </td>
                                        );
                                    case 'targetrelease':
                                        return (
                                            <td key={col.value}>
                                                {ticket.fields.customfield_17644 && ticket.fields.customfield_17644.length > 0
                                                    ? ticket.fields.customfield_17644.map(customfield_17644 => customfield_17644.name).join(', ')
 
                                                    : ''}
                                            </td>
                                        ); 
                                    case 'targetversion':
                                        return (
                                            <td key={col.value}>
                                                {ticket.fields.customfield_11200 && ticket.fields.customfield_11200.length > 0
                                                    ? ticket.fields.customfield_11200.map(customfield_11200 => customfield_11200.name).join(', ')
                                                    : ''}
                                            </td>
                                        );
                                    case 'SRnumber':
                                        return <td key={col.value}>{ticket.fields.customfield_17643}</td>;
                                    case 'salesforceCR':
                                        return <td key={col.value}>{ticket.fields.customfield_17687}</td>;
                                    case 'productLine/engproj/area':
                                        return (
                                            <td key={col.value}>
                                                {ticket.fields.customfield_15028 && ticket.fields.customfield_15028.length > 0
                                                    ? ticket.fields.customfield_15028.map(customfield_15028 => customfield_15028.value).join(', ')
                                                    : ''}
                                            </td>
                                        );
                                    default:
                                        return null;
                                }
                            })}
                        </tr>
                    ))}
                </tbody>
        </table>
    </div>
  );
};

export default AutomationList;
