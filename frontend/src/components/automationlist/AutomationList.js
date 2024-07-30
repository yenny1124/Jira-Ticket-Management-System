import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import Dropdown from 'react-bootstrap/Dropdown';
import DropdownButton from 'react-bootstrap/DropdownButton';
import './automationlist.css';

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

const filters = [
    { name: 'Test Filter', jql: 'assignee = ychoi' },
    { name: 'Missing Primary Component', jql: 'filter = CurrentRelease AND status not in (Open, Targeted, Committed, Declined, Published, "Validated/Completed") AND component not in (TAS, TS, TC-GUI, Documentation, CI, "Mobile App", Licensing, Build, "License Tool or Server", System) AND type != Task AND type != Epic' },
    { name: 'Cloned Defects still Defects', jql: 'filter = CurrentRelease AND (issueFunction in linkedIssuesOf(\"type=Defect\", \"is cloned by\")) and type =Defect' },
    { name: 'Sync SR/CRs to Bugs', jql: "project = LS AND (issueFunction in linkedIssuesOf(\"type=Defect\", \"is cloned by\")) and (\"SR Number\" is EMPTY OR \"SalesForce CR\" is EMPTY)" },
];

const fieldOptions = [
    { label: 'Target Release', value: 'customfield_17644' },
    { label: 'Target Version', value: 'customfield_11200' },
    { label: 'Components', value: 'components' },
    { label: 'SR Number', value: 'customfield_17643' },
    { label: 'Salesforce CR', value: 'customfield_17687' },
    { label: 'Comment', value: 'comment' },
];

const AutomationList = () => {
    const [tickets, setTickets] = useState([]);
    const [jql, setJql] = useState('project = LS'); // Default JQL query
    const [error, setError] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState(columnOptions.map(option => option.value));; // Initially select all columns
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [selectedField, setSelectedField] = useState(null); // ***
    const [comment, setComment] = useState(''); // State for comment input
    const [successMessage, setSuccessMessage] = useState('');
    const [components, setComponents] = useState(''); // State for components input
    const [customfield_17644, setCustomfield_17644] = useState(''); // State for targetrelease (customfield_17644) input
    const [customfield_11200, setCustomfield_11200] = useState(''); // State for targetversion (customfield_11200) input
    const [customfield_17643, setCustomfield_17643] = useState(''); // State for SR Number (customfield_17643) input
    const [customfield_17687, setCustomfield_17687] = useState(''); // State for SalesForce CR (customfield_17687) input

    // function to fetch tickets
    const fetchTickets = async (query) => {
        setError(null);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tickets`, {
                params: { jql: query }
            });
            setTickets(response.data);
        } catch (err) {
            setError(err.message);
        }
    };

    // function to handle search 
    const handleSearch = () => {
        fetchTickets(jql);
    };

    // function to handle selecting a filter
    const handleSelectFilter = (selectedOption) => {
        const filterJql = selectedOption ? selectedOption.value : '';
        setJql(filterJql); // Set the JQL query in the search bar
        fetchTickets(filterJql);
        setSelectedFilter(selectedOption); // Set the selected filter
        console.log("Selected Filter:", selectedOption); // Debug log
    };

    // function to handle selecting a field in tickets *** 
    const handleSelectField = (selectedOption) => {
        setSelectedField(selectedOption); // Set the selected field
    };

    // function to handle selecting columns
    const handleColumnChange = (columnValue) => {
        const updatedColumns = selectedColumns.includes(columnValue)
            ? selectedColumns.filter(col => col !== columnValue)
            : [...selectedColumns, columnValue];
        setSelectedColumns(updatedColumns);
    };

    // function to format descriptions
    const formatDescription = (description) => {
        if (!description) return null;
    
        // Replace {code:java} and {code} with <pre><code> tags
        let formattedDescription = description
            .replace(/\{code:java\}/g, '<pre><code class="language-java">')
            .replace(/\{code\}/g, '</code></pre>');
    
        // Replace !image.png|width=518,height=391! with <img src="image.png" width="518" height="391" />
        formattedDescription = formattedDescription.replace(
            /!(\S+\.(png|jpg|jpeg|gif))\|width=(\d+),height=(\d+)!/g,
            (match, src, extension, width, height) => {
                return `<img src="${src}" width="${width}" height="${height}" />`;
            }
        );
    
        // Replace !document.pdf! with <a href="document.pdf">document.pdf</a>
        formattedDescription = formattedDescription.replace(
            /!(\S+\.(pdf))!/g,
            (match, src, extension) => {
                return `<a href="${src}" target="_blank">${src}</a>`;
            }
        );
    
        // Return the formatted description as raw HTML
        return { __html: formattedDescription };
    };

    // function to format date values 
    const formatDate = (dateString) => {
        if (!dateString) return ''; // Return an empty string if dateString is null or undefined
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = date.toLocaleString('default', { month: 'short' });
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // function to handle syncing SR/CRs to Bugs
    const handleSyncSRCRtoBugs = async (e) => {
        e.preventDefault();
        if (selectedFilter) {
            try {
                const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/tickets/sync-sr-cr-numbers`, { jql: selectedFilter.value });
                console.log(response.data);
                setSuccessMessage('SR/CR Numbers synced successfully!');
            } catch (err) {
                console.error('Error syncing SR/CR Numbers:', err.message);
            }
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
            {/* Form to sync SR/CRs to Bugs */}
            {selectedFilter?.label === 'Sync SR/CRs to Bugs' && (
                <form onSubmit={handleSyncSRCRtoBugs}>
                    <div>
                        <button type="submit" className='action-button-sync-sr-cr'>Sync SR/CR Numbers from Linked Tickets</button>
                    </div>
                </form>
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
        {error && <p>Error: {error}</p>}
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
