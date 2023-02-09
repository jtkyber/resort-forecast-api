const getTopFive = (req, res, db) => {
    db('users').select('username','score')
    .orderBy('score', 'desc')
    .limit(5)
    .then(data => {
        res.json(data);
    })
    .catch(err => res.status(400).json(err))
}

module.exports = {
    getTopFive
};
