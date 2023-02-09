const removeUserSocket = (req, res, db) => {
    const { username } = req.body;
    db('users').where('username', '=', username)
    .update({
        socketid: null
    })
    .then(() => {
        res.json(true);
    })
    .catch(err => res.status(400).json('Error removing socket id'))
}

const addUserSocket = (req, res, db) => {
    const { username, socketid } = req.body;
    db('users').where('username', '=', username)
    .update({
        socketid: socketid
    })
    .then(() => {
        res.json('Socket id removed');
    })
    .catch(err => res.status(400).json('Error removing socket id'))
}

module.exports = {
    removeUserSocket,
    addUserSocket
};
