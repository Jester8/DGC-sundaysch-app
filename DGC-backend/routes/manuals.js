import express from "express";
import Manual from "../models/Manual.js";

const router = express.Router();

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Get recommended manuals (first 4 of January + rotation after 7 days)
router.get('/recommended', async (req, res) => {
  try {
    const currentDate = new Date();
    const dayOfYear = Math.floor((currentDate - new Date(currentDate.getFullYear(), 0, 0)) / 86400000);
    const weekNumber = Math.floor(dayOfYear / 7);
    const startMonthIndex = Math.floor(weekNumber / 4);
    const currentMonthIndex = Math.min(startMonthIndex, 11);
    
    const primaryMonth = months[currentMonthIndex];
    const secondaryMonth = currentMonthIndex < 11 ? months[currentMonthIndex + 1] : months[0];
    
    const primaryManuals = await Manual.find({ month: primaryMonth })
      .sort({ order: 1 })
      .limit(4);
    
    const secondaryManuals = await Manual.find({ month: secondaryMonth })
      .sort({ order: 1 })
      .limit(1);
    
    const recommended = [
      ...primaryManuals.slice(0, 3),
      ...(secondaryManuals.length > 0 ? secondaryManuals : primaryManuals.slice(3, 4))
    ];
    
    res.json({
      success: true,
      data: recommended,
      currentWeek: weekNumber,
      primaryMonth,
      secondaryMonth
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all manuals for a specific month
router.get('/month/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();
    
    if (!months.includes(formattedMonth)) {
      return res.status(400).json({ success: false, message: 'Invalid month' });
    }
    
    const manuals = await Manual.find({ month: formattedMonth }).sort({ order: 1 });
    
    res.json({
      success: true,
      month: formattedMonth,
      count: manuals.length,
      data: manuals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all manuals (for outline view - all months)
router.get('/all', async (req, res) => {
  try {
    const allManuals = await Manual.find().sort({ month: 1, order: 1 });
    
    const groupedByMonth = {};
    months.forEach(month => {
      groupedByMonth[month] = allManuals.filter(m => m.month === month);
    });
    
    res.json({
      success: true,
      data: groupedByMonth,
      totalManuals: allManuals.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create a new manual
router.post('/create', async (req, res) => {
  try {
    const {
      id,
      title,
      theme,
      week,
      date,
      memoryVerse,
      text,
      introduction,
      mainPoints,
      classDiscussion,
      conclusion,
      month,
      order
    } = req.body;

    // Validate required fields
    if (!title || !month || !order) {
      return res.status(400).json({
        success: false,
        message: 'Title, month, and order are required'
      });
    }

    if (!months.includes(month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month'
      });
    }

    const manual = new Manual({
      id: id || `${month.toLowerCase()}_${order}_${Date.now()}`,
      title,
      theme,
      week,
      date,
      memoryVerse,
      text,
      introduction,
      mainPoints: mainPoints || [],
      classDiscussion,
      conclusion,
      month,
      order
    });

    const saved = await manual.save();
    res.status(201).json({
      success: true,
      message: 'Manual created successfully',
      data: saved
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a manual
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (updates.month && !months.includes(updates.month)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month'
      });
    }

    const updated = await Manual.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Manual not found'
      });
    }

    res.json({
      success: true,
      message: 'Manual updated successfully',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a manual
router.delete('/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Manual.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Manual not found'
      });
    }

    res.json({
      success: true,
      message: 'Manual deleted successfully',
      data: deleted
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get manuals by month for editing
router.get('/edit/:month', async (req, res) => {
  try {
    const { month } = req.params;
    const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase();

    if (!months.includes(formattedMonth)) {
      return res.status(400).json({ success: false, message: 'Invalid month' });
    }

    const manuals = await Manual.find({ month: formattedMonth }).sort({ order: 1 });

    res.json({
      success: true,
      month: formattedMonth,
      data: manuals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single manual for editing
router.get('/edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const manual = await Manual.findById(id);

    if (!manual) {
      return res.status(404).json({
        success: false,
        message: 'Manual not found'
      });
    }

    res.json({
      success: true,
      data: manual
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Clear all manuals (use with caution!)
router.delete('/clear/all', async (req, res) => {
  try {
    const result = await Manual.deleteMany({});
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} manuals`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;