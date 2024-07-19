import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import './ticketlist.css';

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
];

const filters = [
    { name: 'Find Bugs missing CR/SR with JQL', jql: 'project = LS AND (issueFunction in linkedIssuesOf(\'type=Defect\', \'is cloned by\')) AND ("SR Number"  is EMPTY OR "CR Number"  is EMPTY)' },
    { name: 'Find Bugs Missing LS Customer with JQL', jql: 'filter = CurrentRelease AND (issueFunction in linkedIssuesOf(\'type=Defect\', \'is cloned by\')) AND "LS Customer" is EMPTY' },
    { name: 'Sync Defect with Bug', jql: 'project = LS AND issueFunction in linkedIssuesOf("type=Defect")' },
    { name: 'Cleanup Defects', jql: 'project = LandSlide AND type=Defect AND "Target Release" is not EMPTY' },
    { name: 'Cloned Defects not converted to a Bug', jql: 'project = LandSlide AND (issueFunction in linkedIssuesOf(\'type=Defect\', \'is cloned by\')) AND type=Defect' },
    { name: 'Tickets without a Primary Component', jql: 'filter = "CurrentRelease" AND status not in (Declined, Published, "Validated/Completed") AND assignee != ebahjat AND component not in ("TAS", "TS", "TC-GUI", "Licensing", "Documentation", "CI", "Mobile App", "Build", "License Tool or Server") AND type != Task AND type != Epic' },
    { name: 'Test Filter', jql: 'assignee = ychoi' },
];

const TicketList = () => {
    const [tickets, setTickets] = useState([]);
    const [jql, setJql] = useState('project = LS'); // Default JQL query
    const [error, setError] = useState(null);
    const [selectedColumns, setSelectedColumns] = useState(columnOptions); // Initially select all columns
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [comment, setComment] = useState(''); // State for comment input
    const [selectedIssueKey, setSelectedIssueKey] = useState(''); // State for selected issue key
    const [successMessage, setSuccessMessage] = useState('');


    // function to fetch tickets
    const fetchTickets = async (query) => {
        setError(null);
        try {
            const response = await axios.get('http://localhost:5000/api/tickets', {
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

    // function to handle seleting columns
    const handleColumnChange = (selectedOptions) => {
        setSelectedColumns(selectedOptions);
    };

    // function to handle selecting a filter 
    const handleSelectFilter = (selectedOption) => {
        const filterJql = selectedOption ? selectedOption.value : '';
        setJql(filterJql); // Set the JQL query in the search bar
        fetchTickets(filterJql);
        setSelectedFilter(null); // Reset the filter to default option
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

    // function to add comments 
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!selectedIssueKey) {
            setError('Please select an issue key.');
            return;
        }
        if (!comment) {
            setError('Please enter a comment.');
            return;
        }
        setError(null);
        try {
            const response = await axios.post(`http://localhost:5000/api/tickets/issue/${selectedIssueKey}/comment`, { body: comment });
            console.log('Comment added:', response.data);
            setComment(''); // Clear the comment input
        } catch (err) {
            setError(err.message);
        }
    };

    // function to add comments
    const handleAddCommenttoEachFilter = async (e) => {
        e.preventDefault();
        if (!jql) {
            setError('Please select a filter/query');
            return;
        }
        if (!comment) {
            setError('Please enter a comment.');
            return;
        }
        setError(null);
        try {
            const response = await axios.post(`http://localhost:5000/api/tickets/comments`, 
                {
                    body: comment // This should be inside the request payload
                }, 
                {
                    params: { jql },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log('Comment added:', response.data);
            setComment(''); // Clear the comment input
            setSuccessMessage('Comment added successfully!'); // Set success message
        } catch (err) {
            setError(err.message);
        }
    };

  return (
    <div className="ticket-list">
        <h1>Landslide Jira Management Automation System</h1>
        {/* Dropdown for filters & columns */}
        <div className='select-container'>
            <Select
                options={filters.map(filter => ({ value: filter.jql, label: filter.name }))}
                value={selectedFilter}
                onChange={handleSelectFilter}
                className="filter-select"
                placeholder="Select a filter"
                isClearable
                />
            <Select
                isMulti
                options={columnOptions}
                value={selectedColumns}
                onChange={handleColumnChange}
                className="multi-select"
                placeholder="Select columns to display"
            />
        </div>
        {/* Search bar */}
        <div className="input-container">
            <input
                type="text"
                value={jql}
                onChange={(e) => setJql(e.target.value)}
                className='search-input'
                placeholder="Enter search query"
            />
            <button 
                onClick={handleSearch}>Search</button>
        </div>
        {/* Form to add comment */}
        <form onSubmit={handleAddCommenttoEachFilter}>
            <div>
                <label htmlFor="jqlQuery">Query for Comments:</label>
                <input
                    type="text"
                    id="selectedFilterQuery"
                    value={jql}
                    onChange={(e) => setJql(e.target.value)}
                    className='search-input'
                    placeholder="Enter jql query"
                />
            </div>
            <div>
                <label htmlFor="comment">Comment:</label>
                <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className='comment-input'
                    placeholder="Enter your comment"
                />
                <button type="submit">Add Comment</button>
            </div>
        </form>
        {successMessage && <p>{successMessage}</p>}
        {error && <p>Error: {error}</p>}
        {/* Table for columns by dropdown */}
        <table>
            <thead>
                <tr>
                    {selectedColumns.map(col => (
                        <th key={col.value}>{col.label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                            {selectedColumns.map(col => {
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

export default TicketList;
