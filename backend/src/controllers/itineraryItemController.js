const itineraryItemService = require('../services/itineraryItemService');

const createItineraryItem = async (req, res) => {
    try {
        const result = await itineraryItemService.createItineraryItem(req.body);
        return res.status(result.code || 201).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const updateItineraryItem = async (req, res) => {
    try {
        const result = await itineraryItemService.updateItineraryItem(req.params.id, req.body);
        return res.status(result.code || 200).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

const deleteItineraryItem = async (req, res) => {
    try {
        const result = await itineraryItemService.deleteItineraryItem(req.params.id);
        return res.status(result.code || 200).json(result);
    } catch (error) {
        return res.status(500).json({ success: false, message: "Internal server error." });
    }
};

module.exports = { createItineraryItem, updateItineraryItem, deleteItineraryItem };