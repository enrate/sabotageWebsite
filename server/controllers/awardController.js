const { Award, UserAward, SquadAward, User, Squad } = require('../models');

// --- CRUD для Award ---
exports.getAllAwards = async (req, res) => {
  const awards = await Award.findAll();
  res.json(awards);
};

exports.getAward = async (req, res) => {
  const award = await Award.findByPk(req.params.id);
  if (!award) return res.status(404).json({ message: 'Награда не найдена' });
  res.json(award);
};

exports.createAward = async (req, res) => {
  const { type, name, description, image } = req.body;
  const award = await Award.create({ type, name, description, image });
  res.status(201).json(award);
};

exports.updateAward = async (req, res) => {
  const { type, name, description, image } = req.body;
  const award = await Award.findByPk(req.params.id);
  if (!award) return res.status(404).json({ message: 'Награда не найдена' });
  await award.update({ type, name, description, image });
  res.json(award);
};

exports.deleteAward = async (req, res) => {
  const award = await Award.findByPk(req.params.id);
  if (!award) return res.status(404).json({ message: 'Награда не найдена' });
  // Проверка: не выдана ли награда кому-либо
  const userCount = await UserAward.count({ where: { awardId: award.id } });
  const squadCount = await SquadAward.count({ where: { awardId: award.id } });
  if (userCount > 0 || squadCount > 0) {
    return res.status(400).json({ message: 'Нельзя удалить награду, которая уже выдана пользователям или отрядам' });
  }
  await award.destroy();
  res.json({ message: 'Награда удалена' });
};

// --- Выдача награды пользователю ---
exports.giveAwardToUser = async (req, res) => {
  const { userId, awardId, comment } = req.body;
  const issuedBy = req.user.id;
  const issuedAt = new Date();
  const userAward = await UserAward.create({ userId, awardId, issuedBy, issuedAt, comment });
  res.status(201).json(userAward);
};

// --- Выдача награды отряду ---
exports.giveAwardToSquad = async (req, res) => {
  const { squadId, awardId, comment } = req.body;
  const issuedBy = req.user.id;
  const issuedAt = new Date();
  const squadAward = await SquadAward.create({ squadId, awardId, issuedBy, issuedAt, comment });
  res.status(201).json(squadAward);
};

// --- Получить награды пользователя ---
exports.getUserAwards = async (req, res) => {
  const userAwards = await UserAward.findAll({
    where: { userId: req.params.userId },
    include: [ { model: Award }, { model: User, as: 'issuer' } ]
  });
  res.json(userAwards);
};

// --- Получить награды отряда ---
exports.getSquadAwards = async (req, res) => {
  const squadAwards = await SquadAward.findAll({
    where: { squadId: req.params.squadId },
    include: [ { model: Award }, { model: User, as: 'issuer' } ]
  });
  res.json(squadAwards);
};

// --- Забрать награду у пользователя ---
exports.removeAwardFromUser = async (req, res) => {
  const { userAwardId } = req.params;
  const userAward = await UserAward.findByPk(userAwardId);
  if (!userAward) return res.status(404).json({ message: 'Запись о награде не найдена' });
  await userAward.destroy();
  res.json({ message: 'Награда у пользователя отозвана' });
};

// --- Забрать награду у отряда ---
exports.removeAwardFromSquad = async (req, res) => {
  const { squadAwardId } = req.params;
  const squadAward = await SquadAward.findByPk(squadAwardId);
  if (!squadAward) return res.status(404).json({ message: 'Запись о награде не найдена' });
  await squadAward.destroy();
  res.json({ message: 'Награда у отряда отозвана' });
};

// --- Получить всех получателей награды ---
exports.getAwardRecipients = async (req, res) => {
  const { awardId } = req.params;
  const userRecipients = await UserAward.findAll({
    where: { awardId },
    include: [ { model: Award }, { model: require('../models').User, as: 'issuer' }, { model: require('../models').User } ]
  });
  const squadRecipients = await SquadAward.findAll({
    where: { awardId },
    include: [ { model: Award }, { model: require('../models').User, as: 'issuer' }, { model: require('../models').Squad } ]
  });
  res.json({ users: userRecipients, squads: squadRecipients });
}; 