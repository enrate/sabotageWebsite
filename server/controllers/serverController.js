exports.getServers = async (req, res) => {
  try {
    // Заглушка для примера
    const servers = [
      { id: 1, name: 'Arma Server #1', status: 'online', players: 24 },
      { id: 2, name: 'Arma Server #2', status: 'offline', players: 0 }
    ];
    res.json(servers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};