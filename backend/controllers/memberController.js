const Member = require('../models/Member');

// CREATE MEMBER (register a new card)
exports.createMember = async (req, res) => {
  try {
    const { card_number, name, phone } = req.body;

    if (!card_number || !name) {
      return res.status(400).json({ message: 'Card number and name are required' });
    }

    const existing = await Member.findOne({ where: { card_number } });
    if (existing) {
      return res.status(400).json({ message: 'This card number is already registered' });
    }

    const member = await Member.create({ card_number, name, phone });
    res.status(201).json({ message: 'Member registered successfully', member });

  } catch (error) {
    res.status(500).json({ message: 'Failed to create member', error: error.message });
  }
};

// LOOKUP MEMBER BY CARD NUMBER (used at checkout)
exports.getMemberByCard = async (req, res) => {
  try {
    const { card_number } = req.params;

    const member = await Member.findOne({ where: { card_number } });
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (!member.is_active) {
            return res.status(403).json({ message: 'This membership card is deactivated' });
          }

    res.status(200).json(member);

  } catch (error) {
    res.status(500).json({ message: 'Failed to find member', error: error.message });
  }
};

// GET ALL MEMBERS (admin list view)
exports.getAllMembers = async (req, res) => {
  try {
    const members = await Member.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get members', error: error.message });
  }
};
// UPDATE MEMBER (edit name, phone, or card number)
exports.updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { card_number, name, phone } = req.body;

    const member = await Member.findByPk(id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    if (card_number && card_number !== member.card_number) {
      const existing = await Member.findOne({ where: { card_number } });
      if (existing) {
        return res.status(400).json({ message: 'This card number is already in use' });
      }
    }

    await member.update({
      card_number: card_number || member.card_number,
      name: name || member.name,
      phone: phone !== undefined ? phone : member.phone
    });

    res.status(200).json({ message: 'Member updated successfully', member });

  } catch (error) {
    res.status(500).json({ message: 'Failed to update member', error: error.message });
  }
};

// DEACTIVATE MEMBER (soft delete — preserves sales history)
exports.deactivateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Member.findByPk(id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    await member.update({ is_active: false });
    res.status(200).json({ message: 'Membership card deactivated', member });
  } catch (error) {
    res.status(500).json({ message: 'Failed to deactivate member', error: error.message });
  }
};

// REACTIVATE MEMBER
exports.reactivateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Member.findByPk(id);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    await member.update({ is_active: true });
    res.status(200).json({ message: 'Membership card reactivated', member });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reactivate member', error: error.message });
  }
};