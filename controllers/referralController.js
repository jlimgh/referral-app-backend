const Referral = require('../models/Referral')
const User = require('../models/User')

// @desc Get all referrals 
// @route GET /referrals
// @access Private
const getAllReferrals = async (req, res) => {
    // Get all referrals from MongoDB
    const referrals = await Referral.find().lean()

    // If no referrals 
    if (!referrals?.length) {
        return res.status(400).json({ message: 'No referrals found' })
    }

    // Add username to each referral before sending the response 
    // See Promise.all with map() here: https://youtu.be/4lqJBBEpjRE 
    // You could also do this with a for...of loop
    const referralWithUser = await Promise.all(referrals.map(async (referral) => {
        const user = await User.findById(referral.user).lean().exec()
        return { ...referral, username: user.username }
    }))

    res.json(referralWithUser)
}

// @desc Create new referral
// @route POST /referral
// @access Private
const createNewReferral = async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate title
    const duplicate = await Referral.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate referral title' })
    }

    // Create and store the new user 
    const referral = await Referral.create({ user, title, text })

    if (referral) { // Created 
        return res.status(201).json({ message: 'New referral created' })
    } else {
        return res.status(400).json({ message: 'Invalid referral data received' })
    }

}

// @desc Update a referral
// @route PATCH /referrals
// @access Private
const updateReferral = async (req, res) => {
    const { id, user, title, text, completed } = req.body

    // Confirm data
    if (!id || !user || !title || !text || typeof completed !== 'boolean') {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm referral exists to update
    const referral = await Referral.findById(id).exec()

    if (!referral) {
        return res.status(400).json({ message: 'Referral not found' })
    }

    // Check for duplicate title
    const duplicate = await Referral.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow renaming of the original referral 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate referral title' })
    }

    referral.user = user
    referral.title = title
    referral.text = text
    referral.completed = completed

    const updatedReferral = await referral.save()

    res.json(`'${updatedReferral.title}' updated`)
}

// @desc Delete a referral
// @route DELETE /referral
// @access Private
const deleteReferral = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Referral ID required' })
    }

    // Confirm referral exists to delete 
    const referral = await Referral.findById(id).exec()

    if (!referral) {
        return res.status(400).json({ message: 'Referral not found' })
    }

    const result = await referral.deleteOne()

    const reply = `Referral '${result.title}' with ID ${result._id} deleted`

    res.json(reply)
}

module.exports = {
    getAllReferrals,
    createNewReferral,
    updateReferral,
    deleteReferral
}