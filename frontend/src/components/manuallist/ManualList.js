import React, { useState, useEffect } from 'react'; // Import necessary React hooks and modules
import axios from 'axios'; // Import axios for making HTTP requests
import Select from 'react-select'; // Import Select component from react-select for dropdowns
import Dropdown from 'react-bootstrap/Dropdown'; // Import Dropdown component from react-bootstrap
import DropdownButton from 'react-bootstrap/DropdownButton'; // Import DropdownButton component from react-bootstrap
import './manuallist.css'; // Import CSS for styling the component

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

// Define field options for updating fields in tickets
const fieldOptions = [
    { label: 'Target Release', value: 'customfield_17644' },
    { label: 'Target Version', value: 'customfield_11200' },
    { label: 'Components', value: 'components' },
    { label: 'SR Number', value: 'customfield_17643' },
    { label: 'Salesforce CR', value: 'customfield_17687' },
    { label: 'Comment', value: 'comment' },
];

const ManualList = () => {
    const [tickets, setTickets] = useState([]); // State to store tickets
    const [jql, setJql] = useState(null); // State for JQL query
    const [error, setError] = useState(null); // State for errors
    const [selectedColumns, setSelectedColumns] = useState(columnOptions.map(option => option.value)); // Initially select all columns
    const [selectedFilter, setSelectedFilter] = useState(null); // State for selected filter
    const [selectedField, setSelectedField] = useState(null); // State for selected field
    const [comment, setComment] = useState(''); // State for comment input
    const [successMessage, setSuccessMessage] = useState(''); // State for success messages
    const [components, setComponents] = useState(''); // State for components input
    const [customfield_17644, setCustomfield_17644] = useState(''); // State for target release (customfield_17644) input
    const [customfield_11200, setCustomfield_11200] = useState(''); // State for target version (customfield_11200) input
    const [customfield_17643, setCustomfield_17643] = useState(''); // State for SR Number (customfield_17643) input
    const [customfield_17687, setCustomfield_17687] = useState(''); // State for SalesForce CR (customfield_17687) input
   
    // Function to fetch tickets based on JQL query
    const fetchTickets = async (query) => {
        setError(null); // Reset error state
        try {
            // Make GET request to fetch tickets
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tickets`, {
                params: { jql: query }
            });
            setTickets(response.data); // Set tickets state with fetched data
        } catch (err) {
            setError(err.message); // Set error state if request fails
        }
    };

    // Function to handle search button click
    const handleSearch = () => {
        fetchTickets(jql); // Fetch tickets with the current JQL query
    };

    // Function to handle selecting columns for display
    const handleColumnChange = (columnValue) => {
        // Toggle column selection
        const updatedColumns = selectedColumns.includes(columnValue)
            ? selectedColumns.filter(col => col !== columnValue)
            : [...selectedColumns, columnValue];
        setSelectedColumns(updatedColumns); // Update selected columns state
    };

    // Function to handle selecting a filter
    const handleSelectFilter = (selectedOption) => {
        const filterJql = selectedOption ? selectedOption.value : '';
        setJql(filterJql); // Set the JQL query in the search bar
        fetchTickets(filterJql); // Fetch tickets with the selected filter
        setSelectedFilter(null); // Reset the filter to default option
    };

    // Function to handle selecting a field for update
    const handleSelectField = (selectedOption) => {
        setSelectedField(selectedOption); // Set the selected field
    };

    // Function to format descriptions with code and images
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

    // Function to format date values
    const formatDate = (dateString) => {
        if (!dateString) return ''; // Return an empty string if dateString is null or undefined
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0'); // Format day with leading zero
        const month = date.toLocaleString('default', { month: 'short' }); // Get abbreviated month name
        const year = date.getFullYear(); // Get full year
        return `${day}/${month}/${year}`; // Return formatted date
    };

    // Function to add comments to tickets
    const handleAddCommenttoEachFilter = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!jql) {
            setError('Please select a filter/query'); // Set error if no filter/query is selected
            return;
        }
        if (!comment) {
            setError('Please enter a comment.'); // Set error if no comment is entered
            return;
        }
        setError(null); // Reset error state
        try {
            // Make POST request to add comment
            const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/tickets/comments`, 
                {
                    body: comment // Include comment in request payload
                }, 
                {
                    params: { jql }, // Include JQL query in request parameters
                    headers: {'Content-Type': 'application/json'} // Set content type header
                }
            );
            console.log('Comment added:', response.data);
            setComment(''); // Clear the comment input field
            setSelectedField(null); // Reset the selected field combo box
            setSuccessMessage('Comment added successfully!'); // Set success message
        } catch (err) {
            setError(err.message); // Set error message if request fails
        }
    };

    // Function to update components field
    const handleUpdateComponents = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!jql) {
            setError('Please select a filter/query'); // Set error if no filter/query is selected
            return;
        }
        if (!components) {
            setError('Please enter components.'); // Set error if no components are entered
            return;
        }
        setError(null); // Reset error state
        try {
            // Make PUT request to update components
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tickets/updateComponents`, 
                { components: components.split(',').map(comp => ({ name: comp.trim() })) }, // Format components input
                { params: { jql }, // Include JQL query in request parameters
                    headers: { 'Content-Type': 'application/json' } } // Set content type header
            );
            console.log('Components updated:', response.data); // Debugging line
            setComponents(''); // Clear the components input field
            setSelectedField(null); // Reset the selected field combo box
            setSuccessMessage('Components updated successfully!'); // Set success message
        } catch (err) {
            setError(err.message); // Set error message if request fails
        }
    };

    // Function to update target release field
    const handleUpdateTargetRelease = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!jql) {
            setError('Please select a filter/query'); // Set error if no filter/query is selected
            return;
        }
        if (!customfield_17644) {
            setError('Please enter target release.'); // Set error if no target release is entered
            return;
        }
        setError(null); // Reset error state
        try {
            // Make PUT request to update target release
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tickets/updateTargetRelease`, 
                { customfield_17644: customfield_17644.split(',').map(targetRel => ({ name: targetRel.trim() })) }, // Format target release input
                { params: { jql }, // Include JQL query in request parameters
                    headers: { 'Content-Type': 'application/json' } } // Set content type header
            );
            console.log('Target Release updated:', response.data); // Debugging line
            setCustomfield_17644(''); // Clear the target release input field
            setSelectedField(null); // Reset the selected field combo box
            setSuccessMessage('Target Release updated successfully!'); // Set success message
        } catch (err) {
            setError(err.message); // Set error message if request fails
        }
    };

    // Function to update target version field
    const handleUpdateTargetVersion = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!jql) {
            setError('Please select a filter/query'); // Set error if no filter/query is selected
            return;
        }
        if (!customfield_11200) {
            setError('Please enter target version.'); // Set error if no target version is entered
            return;
        }
        setError(null); // Reset error state
        try {
            // Make PUT request to update target version
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tickets/updateTargetVersion`, 
                { customfield_11200: customfield_11200.split(',').map(targetVer => ({ name: targetVer.trim() })) }, // Format target version input
                { params: { jql }, // Include JQL query in request parameters
                    headers: { 'Content-Type': 'application/json' } } // Set content type header
            );
            console.log('Target Version updated:', response.data); // Debugging line
            setCustomfield_11200(''); // Clear the target version input field
            setSelectedField(null); // Reset the selected field combo box
            setSuccessMessage('Target Version updated successfully!'); // Set success message
        } catch (err) {
            setError(err.message); // Set error message if request fails
        }
    };

    // Function to update SR Number field
    const handleUpdateSRNumber = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!jql) {
            setError('Please select a filter/query'); // Set error if no filter/query is selected
            return;
        }
        if (!customfield_17643) {
            setError('Please enter SR Number.'); // Set error if no SR Number is entered
            return;
        }
        setError(null); // Reset error state
        try {
            // Make PUT request to update SR Number
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tickets/updateSRnumber`, 
                { customfield_17643: customfield_17643}, // Include SR Number in request payload
                { params: { jql }, // Include JQL query in request parameters
                    headers: { 'Content-Type': 'application/json' } } // Set content type header
            );
            console.log('SR Number updated:', response.data); // Debugging line
            setCustomfield_17643(''); // Clear the SR Number input field
            setSelectedField(null); // Reset the selected field combo box
            setSuccessMessage('SR Number updated successfully!'); // Set success message
        } catch (err) {
            setError(err.message); // Set error message if request fails
        }
    };

    // Function to update SalesForce CR field
    const handleUpdateSalesForceCR  = async (e) => {
        e.preventDefault(); // Prevent default form submission
        if (!jql) {
            setError('Please select a filter/query'); // Set error if no filter/query is selected
            return;
        }
        if (!customfield_17687) {
            setError('Please enter SalesForce CR.'); // Set error if no SalesForce CR is entered
            return;
        }
        setError(null); // Reset error state
        try {
            // Make PUT request to update SalesForce CR
            const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tickets/updateSalesForceCR`, 
                { customfield_17687: customfield_17687}, // Include SalesForce CR in request payload
                { params: { jql }, // Include JQL query in request parameters
                    headers: { 'Content-Type': 'application/json' } } // Set content type header
            );
            console.log('SalesForce CR updated:', response.data); // Debugging line
            setCustomfield_17687(''); // Clear the SalesForce CR input field
            setSelectedField(null); // Reset the selected field combo box
            setSuccessMessage('SalesForce CR updated successfully!'); // Set success message
        } catch (err) {
            setError(err.message); // Set error message if request fails
        }
    };

  return (
    <div className="ticket-list">
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
            {/* Dropdown for field */}
            <div className='field-container'>
                <Select
                    options={fieldOptions}
                    value={selectedField}
                    onChange={handleSelectField}
                    className="field-select"
                    placeholder="Select a field to update"
                    isClearable
                />
            </div>
            {/* Form to add comment */}
            {selectedField?.value === 'comment' && (
            <form onSubmit={handleAddCommenttoEachFilter}>
                <div>
                    <label htmlFor="comment"></label>
                    <input
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className='comment-input'
                        placeholder="Enter your comment"
                    />
                    <button type="submit">Add Comment</button>
                </div>
            </form>
            )}
            {/* Form to update components */}
            {selectedField?.value === 'components' && (
            <form onSubmit={handleUpdateComponents}>
                <div>
                    <label htmlFor="components"></label>
                    <input
                        type="text"
                        id="components"
                        value={components}
                        onChange={(e) => setComponents(e.target.value)}
                        className='components-input'
                        placeholder="Enter components separated by commas"
                    />
                    <button type="submit">Update Components</button>
                </div>
            </form>
            )}
            {/* Form to update targetrelease */}
            {selectedField?.value === 'customfield_17644' && (
            <form onSubmit={handleUpdateTargetRelease}>
                <div>
                    <label htmlFor="targetrelease"></label>
                    <input
                        type="text"
                        id="targetrelease"
                        value={customfield_17644}
                        onChange={(e) => setCustomfield_17644(e.target.value)}
                        className='targetrelease-input'
                        placeholder="Enter target release separated by commas"
                    />
                    <button type="submit">Update Target Release</button>
                </div>
            </form>
            )}
            {/* Form to update targetversion */}
            {selectedField?.value === 'customfield_11200' && (
            <form onSubmit={handleUpdateTargetVersion}>
                <div>
                    <label htmlFor="targetversion"></label>
                    <input
                        type="text"
                        id="targetversion"
                        value={customfield_11200}
                        onChange={(e) => setCustomfield_11200(e.target.value)}
                        className='targetversion-input'
                        placeholder="Enter target version separated by commas"
                    />
                    <button type="submit">Update Target Version</button>
                </div>
            </form>
            )}
            {/* Form to update SR Number */}
            {selectedField?.value === 'customfield_17643' && (
            <form onSubmit={handleUpdateSRNumber}>
                <div>
                    <label htmlFor="SRnumber"></label>
                    <input
                        type="text"
                        id="SRnumber"
                        value={customfield_17643}
                        onChange={(e) => setCustomfield_17643(e.target.value)}
                        className='SRnumber-input'
                        placeholder="Enter SR Number"
                    />
                    <button type="submit">Update SR Number</button>
                </div>
            </form>
            )}
            {/* Form to update SalesForce CR */}
            {selectedField?.value === 'customfield_17687' && (
            <form onSubmit={handleUpdateSalesForceCR}>
                <div>
                    <label htmlFor="salesforceCR"></label>
                    <input
                        type="text"
                        id="salesforceCR"
                        value={customfield_17687}
                        onChange={(e) => setCustomfield_17687(e.target.value)}
                        className='salesforceCR-input'
                        placeholder="Enter SalesForce CR"
                    />
                    <button type="submit">Update SalesForce CR</button>
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

export default ManualList;
