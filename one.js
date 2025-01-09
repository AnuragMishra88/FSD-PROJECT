const express = require('express');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const bodyParser = require('body-parser');
const { createObjectCsvWriter } = require('csv-writer');
const cors = require('cors'); // Optional: CORS for cross-origin requests

const app = express();
const port = 3000;

// Enable CORS for cross-origin requests (optional, only needed if frontend and backend are separate)
app.use(cors());

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files like the HTML form

// Create CSV Writer for registration data
const csvWriter = createObjectCsvWriter({
    path: 'registrations.csv',  // Path to save the CSV file
    header: [
        { id: 'username', title: 'User Name' },
        { id: 'password', title: 'Password' },
        { id: 'email', title: 'Email' },
        { id: 'phone', title: 'Phone No.' },
        { id: 'gender', title: 'Gender' },
        { id: 'dob', title: 'Date of Birth' }
    ],
    append: true  // Append new data instead of overwriting
});

// Serve static registration page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'registration.html')); // Serve registration.html
});

// Serve completion page after successful registration
app.get('/completion', (req, res) => {
    res.sendFile(path.join(__dirname, 'completion.html')); // Serve completion.html
});

// Handle form submission from the registration form
app.post('/register', (req, res) => {
    const { username, password, repeatPassword, email, phone, gender, dob } = req.body;

    // Password validation
    if (password !== repeatPassword) {
        return res.send('Passwords do not match.');
    }

    // Write the form data to the registrations.csv file
    csvWriter
        .writeRecords([{ username, password, email, phone, gender, dob }])
        .then(() => {
            console.log('Data written to CSV');
            // Redirect to the completion page after successful registration
            res.redirect('/completion');
        })
        .catch(err => {
            console.error('Error writing to CSV', err);
            res.send('There was an error with your registration.');
        });
});

// API endpoint to fetch CSV data from 'data.csv'
app.get('/data', (req, res) => {
    const results = [];

    // Read and parse the CSV file (data.csv)
    fs.createReadStream(path.join(__dirname, 'data.csv'))
        .pipe(csv())
        .on('data', (row) => {
            // Remove 'Subcategory' and 'Note' from each row if needed
            delete row.Subcategory;
            delete row.Note;
            results.push(row); // Collect the row after modification
        })
        .on('end', () => {
            // Send the parsed CSV data as a JSON response
            res.json(results);
        })
        .on('error', (err) => {
            console.error('Error reading the CSV file:', err);
            res.status(500).send('Internal Server Error');
        });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
