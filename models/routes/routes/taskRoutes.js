const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

router.get('/', async (req, res) => {
  // Get all tasks
});

router.post('/', async (req, res) => {
  // Create a new task
});

router.put('/:id', async (req, res) => {
  // Update task status
});

router.delete('/:id', async (req, res) => {
  // Delete a task
});

module.exports = router;
