import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [columndata, setcolumndata] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [showDataTable, setShowDataTable] = useState(false); // New state for showing/hiding the Data Table
  const rowsPerPage = 10;

  const handleFileUpload = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a CSV file to upload.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      await axios.post('http://localhost:5000/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleGetData = async () => {
    if (!selectedFile) {
      alert('Please upload a CSV file before fetching data.');
      return;
    }

    try {
      const response = await axios.get('http://localhost:5000/getdata/');

      setTableData(response.data.data);
      setcolumndata(response.data.columns);
      setShowDataTable(true); // Show the Data Table when data is fetched
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage((prevPage) => prevPage - 1);
  };

  const startIndex = currentPage * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const visibleData = tableData.slice(startIndex, endIndex);

  return (
    <div className="App">
      <h1>Upload CSV File</h1>
      <input type="file" onChange={handleFileUpload} />
      <button onClick={handleUpload}>Upload</button>
      <button onClick={handleGetData}>Fetch Data</button>
      {showDataTable && (
      <div>
      <h1>Data Table</h1>
      <table>
        <thead>
          <tr>
            <th>#</th> {/* New column for row numbers */}
            <th>{columndata[0]}</th>
            <th>{columndata[1]}</th>
            <th>{columndata[2]}</th>
            <th>{columndata[3]}</th>
            <th>{columndata[4]}</th>
            <th>{columndata[5]}</th>
            <th>{columndata[6]}</th>
          </tr>
        </thead>
        <tbody>
          {visibleData.map((data, index) => (
            <tr key={index}>
              <td>{startIndex + index + 1}</td> {/* Row number */}
              <td>{new Date(data[0]).toLocaleDateString()}</td>
              <td>{data[1]}</td>
              <td>{data[2]}</td>
              <td>{data[3]}</td>
              <td>{data[4]}</td>
              <td>{data[5]}</td>
              <td>{data[6]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>    )}
    {showDataTable && (
    <div className="pagination">
      <button onClick={handlePrevPage} disabled={currentPage === 0}>
        Previous
      </button>
      <button
        onClick={handleNextPage}
        disabled={endIndex >= tableData.length}
      >
        Next
      </button>
    </div>
    )}
    {/* Show the current page out of all the pages */}
    <p className="page-info">
      Page {currentPage + 1} of {Math.ceil(tableData.length / rowsPerPage)}
    </p>

  </div>
  );
};

export default App;
