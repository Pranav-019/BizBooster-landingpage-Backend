const express = require('express');
const mongoose = require('mongoose');
const Box = require('../models/Box'); // Import model

const router = express.Router();

// POST: Create a new box
router.post('/add', async (req, res) => {
    try {
        const { boxNo, count, title, description } = req.body;

        if (!boxNo || !count || !title || !description) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const newBox = new Box({ boxNo, count, title, description });
        await newBox.save();

        res.status(201).json({ message: "Box added successfully", data: newBox });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
router.get('/get', async (req, res) => {
    try {
        const boxes = await Box.find(); // Retrieve all boxes from the database

        if (!boxes || boxes.length === 0) {
            return res.status(404).json({ error: "No boxes found" });
        }

        res.status(200).json({ message: "Boxes retrieved successfully", data: boxes });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


// PUT: Update an existing box
router.put('/update/:id', async (req, res) => {
    try {
        const { boxNo, count, title, description } = req.body;

        const updatedBox = await Box.findByIdAndUpdate(
            req.params.id,
            { boxNo, count, title, description },
            { new: true }
        );

        if (!updatedBox) {
            return res.status(404).json({ error: "Box not found" });
        }

        res.status(200).json({ message: "Box updated successfully", data: updatedBox });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// DELETE: Remove a box
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedBox = await Box.findByIdAndDelete(req.params.id);

        if (!deletedBox) {
            return res.status(404).json({ error: "Box not found" });
        }

        res.status(200).json({ message: "Box deleted successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = router;
